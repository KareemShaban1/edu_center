<?php



declare(strict_types=1);



namespace App\Http\Requests\Admin;



use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rule;



final class BulkStoreQuestionsRequest extends FormRequest

{

    public function authorize(): bool

    {

        return true;

    }



    /**

     * @return array<string, mixed>

     */

    public function rules(): array

    {

        return [

            'lesson_id' => ['required', 'integer', 'exists:center.lessons,id'],

            'questions' => ['required', 'array', 'min:1'],

            'questions.*.question_text' => ['required', 'string', 'max:1000'],

            'questions.*.type' => ['required', Rule::in(['mcq', 'true_false', 'short_answer'])],

            'questions.*.answers' => ['required', 'array', 'min:1'],

            'questions.*.answers.*.answer_text' => ['required', 'string', 'max:500'],

            'questions.*.answers.*.is_correct' => ['required', 'boolean'],

        ];

    }

}

