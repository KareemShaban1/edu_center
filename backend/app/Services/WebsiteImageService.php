<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Platform\PlatformSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class WebsiteImageService
{
    private const SETTING_KEY = 'website_image_overrides';

    /**
     * @return array<string, array<string, mixed>>
     */
    public function overrides(): array
    {
        $value = PlatformSetting::query()->where('key', self::SETTING_KEY)->value('value');
        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @return array<string, mixed>
     */
    public function update(string $key, UploadedFile $file): array
    {
        $overrides = $this->overrides();
        $previous = $overrides[$key]['path'] ?? null;
        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        $safeKey = preg_replace('/[^A-Za-z0-9_.-]/', '-', $key) ?: 'image';
        $path = $file->storeAs(
            'website-images',
            $safeKey.'-'.now()->format('YmdHis').'.'.$extension,
            'public',
        );

        if (is_string($previous) && $previous !== $path) {
            Storage::disk('public')->delete($previous);
        }

        $dimensions = @getimagesize($file->getRealPath()) ?: null;
        $item = [
            'key' => $key,
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
            'name' => $file->getClientOriginalName(),
            'mime' => $file->getMimeType(),
            'bytes' => $file->getSize(),
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'updated_at' => now()->toIso8601String(),
        ];

        $overrides[$key] = $item;
        $this->saveOverrides($overrides);

        return $item;
    }

    public function destroy(string $key): void
    {
        $overrides = $this->overrides();
        $path = $overrides[$key]['path'] ?? null;
        if (is_string($path)) {
            Storage::disk('public')->delete($path);
        }
        unset($overrides[$key]);
        $this->saveOverrides($overrides);
    }

    /** @param array<string, array<string, mixed>> $overrides */
    private function saveOverrides(array $overrides): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($overrides, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)],
        );
    }
}
