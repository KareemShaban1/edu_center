<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Platform\UiTranslationOverride;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UiTranslationOverride */
final class UiTranslationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'key' => $this->translation_key,
            'en' => $this->en_value,
            'ar' => $this->ar_value,
            'is_deleted' => $this->is_deleted,
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
