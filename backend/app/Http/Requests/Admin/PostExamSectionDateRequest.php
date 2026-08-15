<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class PostExamSectionDateRequest extends FormRequest
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
            'session_id' => ['nullable', 'integer', 'exists:center.sessions,id'],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.status' => ['required', 'in:present,absent,late'],
            'rows.*.degree' => ['nullable', 'string', 'max:10'],
            'rows.*.notes' => ['nullable', 'string'],
        ];
    }
}
