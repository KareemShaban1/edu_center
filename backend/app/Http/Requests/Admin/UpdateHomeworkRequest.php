<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateHomeworkRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'start_date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
        ];
    }
}
