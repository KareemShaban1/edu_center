<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateStudentRequest extends FormRequest
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
        $id = (int) $this->route('id');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:mysql.students,code,'.$id],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.students,email,'.$id],
            'phone' => ['nullable', 'string', 'max:20', 'unique:mysql.students,phone,'.$id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'gender' => ['required', 'in:male,female'],
            'status' => ['nullable', 'string'],
            'grade_id' => ['required', 'integer', 'min:1', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'min:1', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'min:1', 'exists:center.sections,id'],
            'parent_id' => ['nullable', 'integer', 'exists:center.parents,id'],
        ];
    }
}
