<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class StoreTeacherRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255', 'unique:mysql.teachers,email'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'specialization' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:20'],
            'gender' => ['required', 'in:male,female'],
            'status' => ['nullable', 'in:active,inactive'],
            'class_ids' => ['nullable', 'array'],
            'class_ids.*' => ['integer', 'exists:center.classes,id'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ];
    }
}
