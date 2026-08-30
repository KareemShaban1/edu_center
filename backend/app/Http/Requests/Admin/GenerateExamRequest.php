<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class GenerateExamRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'lesson_ids' => ['required', 'array', 'min:1'],
            'lesson_ids.*' => ['integer', 'exists:center.lessons,id'],
            'selection_mode' => ['nullable', Rule::in(['random', 'manual'])],
            'question_count' => ['nullable', 'integer', 'min:1'],
            'question_ids' => ['nullable', 'array', 'min:1'],
            'question_ids.*' => ['integer', 'exists:center.questions,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
