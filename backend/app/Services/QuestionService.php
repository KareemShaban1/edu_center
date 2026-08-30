<?php



declare(strict_types=1);



namespace App\Services;



use App\Http\Support\CenterIdAssigner;

use App\Models\Answer;

use App\Models\Exam;

use App\Models\Lesson;

use App\Models\Platform\Center;

use App\Models\Question;

use Illuminate\Http\Exceptions\HttpResponseException;

use Illuminate\Support\Facades\DB;



final class QuestionService

{

    /**

     * @param  array<string, mixed>  $payload

     * @return array<string, mixed>

     */

    public function create(array $payload, Center $tenant): array

    {

        return DB::connection('center')->transaction(function () use ($payload, $tenant): array {

            $question = new Question();

            $this->fillQuestion($question, $payload, $tenant);

            $question->save();



            $this->syncAnswers($question, $payload['answers'] ?? [], $tenant);



            return $this->formatQuestion($question->fresh(['answers']));

        });

    }



    /**

     * @param  array<string, mixed>  $payload

     * @return array<string, mixed>

     */

    public function update(int $id, array $payload, Center $tenant): array

    {

        $question = Question::query()->with('answers')->find($id);

        if ($question === null) {

            throw new HttpResponseException(

                response()->json(['message' => 'Question not found'], 404)

            );

        }



        return DB::connection('center')->transaction(function () use ($question, $payload, $tenant): array {

            $this->fillQuestion($question, $payload, $tenant, onlyIfMissingCenter: true);

            $question->save();



            $this->syncAnswers($question, $payload['answers'] ?? [], $tenant);



            return $this->formatQuestion($question->fresh(['answers']));

        });

    }



    public function delete(int $id): void

    {

        $question = Question::query()->find($id);

        if ($question === null) {

            throw new HttpResponseException(

                response()->json(['message' => 'Question not found'], 404)

            );

        }



        $examIds = $question->exams()->pluck('exams.id');



        DB::connection('center')->transaction(function () use ($question, $examIds): void {

            $question->exams()->detach();

            $question->answers()->delete();

            $question->delete();



            foreach ($examIds as $examId) {

                $exam = Exam::query()->find($examId);

                if ($exam) {

                    $this->refreshExamQuestionCount($exam);

                }

            }

        });

    }



    /**

     * @param  array<string, mixed>  $payload

     * @return array{created: list<array<string, mixed>>, count: int}

     */

    public function bulkCreate(array $payload, Center $tenant): array

    {

        $questionsPayload = $payload['questions'] ?? [];



        return DB::connection('center')->transaction(function () use ($questionsPayload, $payload, $tenant): array {

            $created = [];



            foreach ($questionsPayload as $row) {

                $question = new Question();

                $this->fillQuestion($question, array_merge($row, [

                    'lesson_id' => $row['lesson_id'] ?? $payload['lesson_id'] ?? null,

                ]), $tenant);

                $question->save();



                $this->syncAnswers($question, $row['answers'] ?? [], $tenant);

                $created[] = $this->formatQuestion($question->fresh(['answers']));

            }



            return [

                'created' => $created,

                'count' => count($created),

            ];

        });

    }



    /**

     * @param  array<string, mixed>  $payload

     */

    private function fillQuestion(

        Question $question,

        array $payload,

        Center $tenant,

        bool $onlyIfMissingCenter = false,

    ): void {

        $question->question_text = (string) $payload['question_text'];

        $question->type = (string) $payload['type'];

        $question->lesson_id = isset($payload['lesson_id']) && $payload['lesson_id'] !== ''

            ? (int) $payload['lesson_id']

            : null;



        if (! $question->lesson_id) {

            throw new HttpResponseException(response()->json(['message' => 'Lesson is required'], 422));

        }



        $lesson = Lesson::query()->with('unit.classes')->find($question->lesson_id);

        if ($lesson === null || ! $lesson->unit || ! $lesson->unit->classes) {

            throw new HttpResponseException(response()->json(['message' => 'Lesson not found'], 404));

        }



        $question->grade_id = (int) $lesson->unit->classes->grade_id;

        $question->class_id = (int) $lesson->unit->class_id;



        CenterIdAssigner::assign($question, (int) $tenant->id, onlyIfMissing: $onlyIfMissingCenter);

    }



    /**

     * @param  list<array<string, mixed>>  $answersPayload

     */

    private function syncAnswers(Question $question, array $answersPayload, Center $tenant): void

    {

        $keptIds = [];



        foreach ($answersPayload as $row) {

            $answerText = trim((string) ($row['answer_text'] ?? ''));

            if ($answerText === '') {

                continue;

            }



            $answerId = isset($row['id']) ? (int) $row['id'] : null;

            if ($answerId) {

                $answer = Answer::query()

                    ->where('question_id', $question->id)

                    ->where('id', $answerId)

                    ->first();

            } else {

                $answer = new Answer();

                $answer->question_id = $question->id;

            }



            if ($answer === null) {

                continue;

            }



            $answer->answer_text = $answerText;

            $answer->is_correct = (bool) ($row['is_correct'] ?? false);

            CenterIdAssigner::assign($answer, (int) $tenant->id, onlyIfMissing: true);

            $answer->save();

            $keptIds[] = $answer->id;

        }



        $question->answers()

            ->when($keptIds !== [], fn ($query) => $query->whereNotIn('id', $keptIds))

            ->when($keptIds === [], fn ($query) => $query)

            ->delete();

    }



    public function refreshExamQuestionCount(Exam $exam): void

    {

        $exam->total_questions = $exam->questions()->count();

        $exam->save();

    }



    /**

     * @return array<string, mixed>

     */

    public function formatQuestion(Question $question, ?int $sortOrder = null): array

    {

        $examIds = $question->relationLoaded('exams')

            ? $question->exams->pluck('id')->values()->all()

            : $question->exams()->pluck('exams.id')->values()->all();



        return [

            'id' => $question->id,

            'question_text' => $question->question_text,

            'type' => $question->type,

            'exam_ids' => $examIds,

            'lesson_id' => $question->lesson_id,

            'grade_id' => $question->grade_id,

            'class_id' => $question->class_id,

            'sort_order' => $sortOrder ?? ($question->pivot?->sort_order ?? null),

            'answers' => $question->answers->map(fn (Answer $answer) => [

                'id' => $answer->id,

                'answer_text' => $answer->answer_text,

                'is_correct' => (bool) $answer->is_correct,

                'question_id' => $answer->question_id,

            ])->values()->all(),

        ];

    }

}

