<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateAnnouncementRequest extends FormRequest
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
            'content' => ['required', 'string'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:homework,quiz,exam,others'],
            'time' => ['nullable', 'date'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ];
    }
}
