<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class StoreWhatsappTemplateRequest extends FormRequest
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
            'type' => ['nullable', 'string', 'in:general,attendance,exam,quiz,homework,announcement,payment'],
            'content' => ['required', 'string', 'max:4000'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string', 'max:64'],
        ];
    }
}
