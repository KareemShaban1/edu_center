<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

final class AdminSendNotificationRequest extends FormRequest
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
            'body' => ['required', 'string', 'max:2000'],
            'audience' => ['required', 'in:students,parents,both'],
            'section_id' => ['nullable', 'integer', 'exists:center.sections,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:center.students,id'],
            'parent_ids' => ['nullable', 'array'],
            'parent_ids.*' => ['integer', 'exists:center.parents,id'],
            'url' => ['nullable', 'string', 'max:500'],
            'send_push' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $payload = $this->all();

            if (
                empty($payload['section_id'])
                && empty($payload['student_ids'])
                && empty($payload['parent_ids'])
            ) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Select a section or specific recipients.',
                ], 422));
            }
        });
    }
}
