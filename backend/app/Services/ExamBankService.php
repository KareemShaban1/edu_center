<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\Exam;
use App\Models\Lesson;
use App\Models\Platform\Center;
use App\Models\Question;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class ExamBankService
{
    public function __construct(
        private readonly QuestionService $questionService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function create(array $payload, Center $tenant): array
    {
        $exam = new Exam();
        $exam->name = (string) $payload['name'];
        $exam->grade_id = (int) $payload['grade_id'];
        $exam->class_id = (int) $payload['class_id'];
        $exam->total_questions = 0;
        $exam->notes = $payload['notes'] ?? null;
        CenterIdAssigner::assign($exam, (int) $tenant->id);
        $exam->save();

        $this->syncExamQuestions($exam, $payload['question_ids'] ?? []);

        return $this->formatExam($exam->fresh(['questions.answers', 'lessons']));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function update(int $id, array $payload, Center $tenant): array
    {
        $exam = $this->find($id);
        $exam->name = (string) $payload['name'];
        $exam->grade_id = (int) $payload['grade_id'];
        $exam->class_id = (int) $payload['class_id'];
        $exam->notes = $payload['notes'] ?? null;
        CenterIdAssigner::assign($exam, (int) $tenant->id, onlyIfMissing: true);
        $exam->save();

        if (array_key_exists('question_ids', $payload)) {
            $this->syncExamQuestions($exam, $payload['question_ids'] ?? []);
        }

        return $this->formatExam($exam->fresh(['questions.answers', 'lessons']));
    }

    public function find(int $id): Exam
    {
        $exam = Exam::query()->with(['lessons', 'questions.answers'])->find($id);
        if ($exam === null) {
            throw new HttpResponseException(response()->json(['message' => 'Exam not found'], 404));
        }

        return $exam;
    }

    public function delete(int $id): void
    {
        $exam = $this->find($id);

        DB::connection('center')->transaction(function () use ($exam): void {
            $exam->questions()->detach();
            $exam->lessons()->detach();
            $exam->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function generateFromLessons(array $payload, Center $tenant): array
    {
        $lessonIds = collect($payload['lesson_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($lessonIds->isEmpty()) {
            throw new HttpResponseException(response()->json(['message' => 'At least one lesson is required'], 422));
        }

        $lessons = Lesson::query()->with('unit.classes')->whereIn('id', $lessonIds)->get();
        if ($lessons->count() !== $lessonIds->count()) {
            throw new HttpResponseException(response()->json(['message' => 'One or more lessons were not found'], 404));
        }

        $classIds = $lessons->pluck('unit.class_id')->unique();
        if ($classIds->count() > 1) {
            throw new HttpResponseException(response()->json(['message' => 'All lessons must belong to the same class'], 422));
        }

        $firstLesson = $lessons->first();
        $gradeId = (int) $firstLesson->unit->classes->grade_id;

        $poolQuestions = Question::query()
            ->whereIn('lesson_id', $lessonIds)
            ->with('answers')
            ->get();

        if ($poolQuestions->isEmpty()) {
            throw new HttpResponseException(response()->json(['message' => 'No questions found for the selected lessons'], 422));
        }

        $selectionMode = (string) ($payload['selection_mode'] ?? 'random');
        $manualQuestionIds = collect($payload['question_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($selectionMode === 'manual' || $manualQuestionIds->isNotEmpty()) {
            if ($manualQuestionIds->isEmpty()) {
                throw new HttpResponseException(response()->json(['message' => 'Select at least one question'], 422));
            }

            $selected = $poolQuestions
                ->whereIn('id', $manualQuestionIds->all())
                ->values();

            if ($selected->count() !== $manualQuestionIds->count()) {
                throw new HttpResponseException(response()->json(['message' => 'One or more selected questions are invalid for the chosen lessons'], 422));
            }

            $selectedIds = $manualQuestionIds->all();
        } else {
            $requestedCount = isset($payload['question_count']) && $payload['question_count'] !== ''
                ? (int) $payload['question_count']
                : $poolQuestions->count();

            if ($requestedCount < 1 || $requestedCount > $poolQuestions->count()) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Invalid question count',
                    'available' => $poolQuestions->count(),
                ], 422));
            }

            $selectedIds = $poolQuestions->shuffle()->take($requestedCount)->pluck('id')->all();
        }

        return DB::connection('center')->transaction(function () use ($payload, $tenant, $lessonIds, $selectedIds, $gradeId, $firstLesson): array {
            $exam = new Exam();
            $exam->name = (string) $payload['name'];
            $exam->grade_id = $gradeId;
            $exam->class_id = (int) $firstLesson->unit->class_id;
            $exam->notes = $payload['notes'] ?? null;
            $exam->total_questions = 0;
            CenterIdAssigner::assign($exam, (int) $tenant->id);
            $exam->save();
            $exam->lessons()->sync($lessonIds->all());
            $this->syncExamQuestions($exam, $selectedIds);

            return $this->formatExam($exam->fresh(['questions.answers', 'lessons']));
        });
    }

    /**
     * @param  list<int>  $questionIds
     */
    private function syncExamQuestions(Exam $exam, array $questionIds): void
    {
        $ids = collect($questionIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            $exam->questions()->detach();
            $this->refreshQuestionCount($exam);

            return;
        }

        $questions = Question::query()->whereIn('id', $ids)->get();
        if ($questions->count() !== $ids->count()) {
            throw new HttpResponseException(response()->json(['message' => 'One or more questions were not found'], 404));
        }

        $invalidClass = $questions->first(fn (Question $question) => (int) $question->class_id !== (int) $exam->class_id);
        if ($invalidClass) {
            throw new HttpResponseException(response()->json(['message' => 'All questions must belong to the exam class'], 422));
        }

        $syncPayload = [];
        foreach ($ids as $index => $questionId) {
            $syncPayload[$questionId] = ['sort_order' => $index + 1];
        }

        $exam->questions()->sync($syncPayload);
        $this->refreshQuestionCount($exam);
    }

    public function refreshQuestionCount(Exam $exam): void
    {
        $exam->total_questions = $exam->questions()->count();
        $exam->save();
    }

    /**
     * @param  list<int>  $questionIds
     * @return array<string, mixed>
     */
    public function reorderQuestions(int $examId, array $questionIds): array
    {
        $exam = $this->find($examId);

        $requestedIds = collect($questionIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->values();

        $existingIds = $exam->questions()->pluck('questions.id')->sort()->values();

        if ($requestedIds->count() !== $existingIds->count()) {
            throw new HttpResponseException(response()->json(['message' => 'Question list does not match this exam'], 422));
        }

        if ($requestedIds->sort()->values()->all() !== $existingIds->all()) {
            throw new HttpResponseException(response()->json(['message' => 'One or more questions do not belong to this exam'], 422));
        }

        DB::connection('center')->transaction(function () use ($requestedIds, $exam): void {
            foreach ($requestedIds as $index => $questionId) {
                $exam->questions()->updateExistingPivot($questionId, ['sort_order' => $index + 1]);
            }
        });

        return $this->formatExam($exam->fresh(['questions.answers', 'lessons']));
    }

    /**
     * @return array<string, mixed>
     */
    public function formatExam(Exam $exam): array
    {
        return [
            'id' => $exam->id,
            'name' => $exam->name,
            'grade_id' => $exam->grade_id,
            'class_id' => $exam->class_id,
            'total_questions' => $exam->questions->count() ?: $exam->total_questions,
            'notes' => $exam->notes ?? '',
            'lesson_ids' => $exam->lessons->pluck('id')->values()->all(),
            'lesson_names' => $exam->lessons->pluck('name')->values()->all(),
            'question_ids' => $exam->questions->pluck('id')->values()->all(),
            'questions' => $exam->questions->map(fn (Question $q) => $this->questionService->formatQuestion(
                $q,
                (int) ($q->pivot->sort_order ?? 0)
            ))->values()->all(),
            'layout' => \App\Services\ExamExportService::normalizeLayout(
                is_array($exam->layout) ? $exam->layout : []
            ),
            'created_at' => $exam->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listSummaries(): Collection
    {
        return Exam::query()
            ->withCount('questions')
            ->with(['lessons:id,name', 'questions:id'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (Exam $exam) => [
                'id' => $exam->id,
                'name' => $exam->name,
                'grade_id' => $exam->grade_id,
                'class_id' => $exam->class_id,
                'total_questions' => $exam->questions_count,
                'notes' => $exam->notes ?? '',
                'lesson_ids' => $exam->lessons->pluck('id')->values()->all(),
                'lesson_names' => $exam->lessons->pluck('name')->values()->all(),
                'question_ids' => $exam->questions->pluck('id')->values()->all(),
                'created_at' => $exam->created_at?->toIso8601String(),
            ]);
    }
}
