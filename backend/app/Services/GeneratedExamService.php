<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\GeneratedExam;
use App\Models\GeneratedExamQuestion;
use App\Models\Lesson;
use App\Models\Platform\Center;
use App\Models\Question;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class GeneratedExamService
{
    public function __construct(
        private readonly QuestionService $questionService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function generate(array $payload, Center $tenant): array
    {
        $lessonIds = collect($payload['lesson_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($lessonIds->isEmpty()) {
            throw new HttpResponseException(
                response()->json(['message' => 'At least one lesson is required'], 422)
            );
        }

        $lessons = Lesson::query()
            ->with('unit.classes')
            ->whereIn('id', $lessonIds)
            ->get();

        if ($lessons->count() !== $lessonIds->count()) {
            throw new HttpResponseException(
                response()->json(['message' => 'One or more lessons were not found'], 404)
            );
        }

        $classIds = $lessons->pluck('unit.class_id')->unique();
        if ($classIds->count() > 1) {
            throw new HttpResponseException(
                response()->json(['message' => 'All lessons must belong to the same class'], 422)
            );
        }

        $firstLesson = $lessons->first();
        $classId = (int) $firstLesson->unit->class_id;
        $gradeId = (int) $firstLesson->unit->classes->grade_id;

        $availableQuestions = Question::query()
            ->whereIn('lesson_id', $lessonIds)
            ->with('answers')
            ->get();

        if ($availableQuestions->isEmpty()) {
            throw new HttpResponseException(
                response()->json(['message' => 'No questions found for the selected lessons'], 422)
            );
        }

        $requestedCount = isset($payload['question_count']) && $payload['question_count'] !== ''
            ? (int) $payload['question_count']
            : $availableQuestions->count();

        if ($requestedCount < 1) {
            throw new HttpResponseException(
                response()->json(['message' => 'Question count must be at least 1'], 422)
            );
        }

        if ($requestedCount > $availableQuestions->count()) {
            throw new HttpResponseException(
                response()->json([
                    'message' => 'Not enough questions available',
                    'available' => $availableQuestions->count(),
                ], 422)
            );
        }

        $selectedQuestions = $availableQuestions
            ->shuffle()
            ->take($requestedCount)
            ->values();

        return DB::connection('center')->transaction(function () use (
            $payload,
            $tenant,
            $lessonIds,
            $selectedQuestions,
            $gradeId,
            $classId,
        ): array {
            $exam = new GeneratedExam();
            $exam->name = (string) $payload['name'];
            $exam->grade_id = $gradeId;
            $exam->class_id = $classId;
            $exam->total_questions = $selectedQuestions->count();
            $exam->notes = $payload['notes'] ?? null;
            CenterIdAssigner::assign($exam, (int) $tenant->id);
            $exam->save();

            $exam->lessons()->sync($lessonIds->all());

            foreach ($selectedQuestions as $index => $question) {
                GeneratedExamQuestion::query()->create([
                    'generated_exam_id' => $exam->id,
                    'question_id' => $question->id,
                    'sort_order' => $index + 1,
                ]);
            }

            return $this->formatExam(
                $exam->fresh(['lessons', 'questions.answers'])
            );
        });
    }

    public function delete(int $id): void
    {
        $exam = GeneratedExam::query()->find($id);
        if ($exam === null) {
            throw new HttpResponseException(
                response()->json(['message' => 'Generated exam not found'], 404)
            );
        }

        DB::connection('center')->transaction(function () use ($exam): void {
            $exam->examQuestions()->delete();
            $exam->lessons()->detach();
            $exam->delete();
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function formatExam(GeneratedExam $exam): array
    {
        return [
            'id' => $exam->id,
            'name' => $exam->name,
            'grade_id' => $exam->grade_id,
            'class_id' => $exam->class_id,
            'total_questions' => $exam->total_questions,
            'notes' => $exam->notes ?? '',
            'lesson_ids' => $exam->lessons->pluck('id')->values()->all(),
            'questions' => $exam->questions->map(fn (Question $question) => $this->questionService->formatQuestion($question))->values()->all(),
            'created_at' => $exam->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listSummaries(): Collection
    {
        return GeneratedExam::query()
            ->with(['lessons:id,name'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (GeneratedExam $exam) => [
                'id' => $exam->id,
                'name' => $exam->name,
                'grade_id' => $exam->grade_id,
                'class_id' => $exam->class_id,
                'total_questions' => $exam->total_questions,
                'notes' => $exam->notes ?? '',
                'lesson_ids' => $exam->lessons->pluck('id')->values()->all(),
                'lesson_names' => $exam->lessons->pluck('name')->values()->all(),
                'created_at' => $exam->created_at?->toIso8601String(),
            ]);
    }
}
