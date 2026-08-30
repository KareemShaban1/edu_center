<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class StoreExamBankRequest extends FormRequest
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
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'question_ids' => ['nullable', 'array'],
            'question_ids.*' => ['integer', 'exists:center.questions,id'],
        ];
    }
}
