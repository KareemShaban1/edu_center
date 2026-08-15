<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Platform\UiTranslationOverride;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class UiTranslationService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(): Collection
    {
        return UiTranslationOverride::query()
            ->orderBy('translation_key')
            ->get()
            ->map(fn (UiTranslationOverride $item) => [
                'key' => $item->translation_key,
                'en' => $item->en_value,
                'ar' => $item->ar_value,
                'is_deleted' => $item->is_deleted,
                'updated_at' => optional($item->updated_at)?->toIso8601String(),
            ])
            ->values();
    }

    /**
     * @param  array{key: string, en: string, ar: string}  $payload
     */
    public function store(array $payload): UiTranslationOverride
    {
        return UiTranslationOverride::query()->updateOrCreate(
            ['translation_key' => $payload['key']],
            [
                'en_value' => $payload['en'],
                'ar_value' => $payload['ar'],
                'is_deleted' => false,
            ],
        );
    }

    /**
     * @param  array{key: string, en: string, ar: string}  $payload
     */
    public function update(string $key, array $payload): UiTranslationOverride
    {
        return DB::transaction(function () use ($key, $payload): UiTranslationOverride {
            if ($payload['key'] !== $key) {
                UiTranslationOverride::query()->updateOrCreate(
                    ['translation_key' => $key],
                    ['en_value' => null, 'ar_value' => null, 'is_deleted' => true],
                );
            }

            return UiTranslationOverride::query()->updateOrCreate(
                ['translation_key' => $payload['key']],
                [
                    'en_value' => $payload['en'],
                    'ar_value' => $payload['ar'],
                    'is_deleted' => false,
                ],
            );
        });
    }

    public function destroy(string $key): void
    {
        UiTranslationOverride::query()->updateOrCreate(
            ['translation_key' => $key],
            ['en_value' => null, 'ar_value' => null, 'is_deleted' => true],
        );
    }
}
