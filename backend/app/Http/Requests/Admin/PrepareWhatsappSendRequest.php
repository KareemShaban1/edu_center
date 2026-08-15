<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

final class PrepareWhatsappSendRequest extends FormRequest
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
            'template_id' => ['required', 'integer', 'exists:center.whatsapp_templates,id'],
            'audience' => ['required', 'in:students,parents,both'],
            'section_id' => ['nullable', 'integer', 'exists:center.sections,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:center.students,id'],
            'parent_ids' => ['nullable', 'array'],
            'parent_ids.*' => ['integer', 'exists:center.parents,id'],
            'variables' => ['nullable', 'array'],
            'student_variables' => ['nullable', 'array'],
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
