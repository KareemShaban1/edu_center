<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateStudentGradeRequest extends FormRequest
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
            'date' => ['required', 'date'],
            'degree' => ['nullable', 'numeric'],
            'attendance_status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
