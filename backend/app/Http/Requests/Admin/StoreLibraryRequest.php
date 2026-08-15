<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class StoreLibraryRequest extends FormRequest
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
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
