<?php

declare(strict_types=1);

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreUiTranslationRequest extends FormRequest
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
        return $this->translationRules();
    }

    /**
     * @return array<string, mixed>
     */
    public static function translationRules(?string $currentKey = null): array
    {
        return [
            'key' => [
                'required',
                'string',
                'max:190',
                'regex:/^[A-Za-z0-9_.-]+$/',
                Rule::unique('ui_translation_overrides', 'translation_key')
                    ->ignore($currentKey, 'translation_key')
                    ->where(fn ($query) => $query->where('is_deleted', false)),
            ],
            'en' => ['required', 'string', 'max:10000'],
            'ar' => ['required', 'string', 'max:10000'],
        ];
    }
}
