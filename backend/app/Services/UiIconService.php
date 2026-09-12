<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Platform\PlatformSetting;

final class UiIconService
{
    private const SETTING_KEY = 'ui_icon_overrides';

    /**
     * @return array<string, string> key => Lucide icon name
     */
    public function overrides(): array
    {
        $value = PlatformSetting::query()->where('key', self::SETTING_KEY)->value('value');
        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);
        if (! is_array($decoded)) {
            return [];
        }

        $result = [];
        foreach ($decoded as $key => $icon) {
            if (! is_string($key) || $key === '' || ! is_string($icon) || $icon === '') {
                continue;
            }
            $result[$key] = $icon;
        }

        return $result;
    }

    /**
     * @param  array<string, string>  $overrides
     * @return array<string, string>
     */
    public function save(array $overrides): array
    {
        $normalized = [];
        foreach ($overrides as $key => $icon) {
            if (! is_string($key) || $key === '' || ! is_string($icon) || $icon === '') {
                continue;
            }
            $safeKey = preg_replace('/[^A-Za-z0-9_.:\/-]/', '', $key) ?: '';
            $safeIcon = preg_replace('/[^A-Za-z0-9]/', '', $icon) ?: '';
            if ($safeKey === '' || $safeIcon === '') {
                continue;
            }
            $normalized[$safeKey] = $safeIcon;
        }

        PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($normalized, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)],
        );

        return $normalized;
    }

    /**
     * @return array<string, string>
     */
    public function updateOne(string $key, string $icon): array
    {
        $overrides = $this->overrides();
        $safeKey = preg_replace('/[^A-Za-z0-9_.:\/-]/', '', $key) ?: '';
        $safeIcon = preg_replace('/[^A-Za-z0-9]/', '', $icon) ?: '';
        if ($safeKey === '' || $safeIcon === '') {
            return $overrides;
        }
        $overrides[$safeKey] = $safeIcon;

        return $this->save($overrides);
    }

    /**
     * @return array<string, string>
     */
    public function destroy(string $key): array
    {
        $overrides = $this->overrides();
        unset($overrides[$key]);

        return $this->save($overrides);
    }
}
