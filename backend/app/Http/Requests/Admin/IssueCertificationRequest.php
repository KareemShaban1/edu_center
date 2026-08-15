<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

final class IssueCertificationRequest extends FormRequest
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
            'template_id' => ['nullable', 'integer', 'exists:center.certification_templates,id'],
            'custom_title' => ['nullable', 'string', 'max:255', 'required_without:template_id'],
            'custom_content' => ['nullable', 'string', 'max:8000', 'required_without:template_id'],
            'section_id' => ['nullable', 'integer', 'exists:center.sections,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:center.students,id'],
            'variables' => ['nullable', 'array'],
            'student_variables' => ['nullable', 'array'],
            'context' => ['nullable', 'string', 'max:32'],
            'context_date' => ['nullable', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $payload = $this->all();

            if (empty($payload['template_id']) && (empty($payload['custom_title']) || empty($payload['custom_content']))) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Select a template or provide custom title and content.',
                ], 422));
            }

            if (empty($payload['section_id']) && empty($payload['student_ids'])) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Select a section or specific students.',
                ], 422));
            }
        });
    }
}
