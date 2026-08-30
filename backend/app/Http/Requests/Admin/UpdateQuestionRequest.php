<?php



declare(strict_types=1);



namespace App\Http\Requests\Admin;



use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rule;



final class UpdateQuestionRequest extends FormRequest

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

            'question_text' => ['required', 'string', 'max:1000'],

            'type' => ['required', Rule::in(['mcq', 'true_false', 'short_answer'])],

            'lesson_id' => ['required', 'integer', 'exists:center.lessons,id'],

            'answers' => ['required', 'array', 'min:1'],

            'answers.*.id' => ['nullable', 'integer'],

            'answers.*.answer_text' => ['required', 'string', 'max:500'],

            'answers.*.is_correct' => ['required', 'boolean'],

        ];

    }

}

