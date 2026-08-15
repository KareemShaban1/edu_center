<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class StoreCertificationTemplateRequest extends FormRequest
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
            'content' => ['required', 'string', 'max:8000'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string', 'max:64'],
            'design_id' => ['nullable', 'string', 'max:64'],
            'design' => ['nullable', 'array'],
        ];
    }
}
