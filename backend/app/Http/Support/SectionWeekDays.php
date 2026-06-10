<?php

declare(strict_types=1);

namespace App\Http\Support;

class SectionWeekDays
{
    public const DAYS = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
    ];

    /**
     * @return array<int, array{day: string, time: string}>
     */
    public static function decode(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? self::sanitize($decoded) : [];
        }

        if (is_array($value)) {
            return self::sanitize($value);
        }

        return [];
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $items
     */
    public static function encode(?array $items): ?string
    {
        if ($items === null) {
            return null;
        }

        $sanitized = self::sanitize($items);

        return $sanitized === [] ? null : json_encode($sanitized, JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array{day: string, time: string}>
     */
    public static function sanitize(array $items): array
    {
        $result = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $day = strtolower(trim((string) ($item['day'] ?? '')));
            $time = trim((string) ($item['time'] ?? ''));

            if (! in_array($day, self::DAYS, true) || ! preg_match('/^\d{2}:\d{2}$/', $time)) {
                continue;
            }

            $result[] = ['day' => $day, 'time' => $time];
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        $days = implode(',', self::DAYS);

        return [
            'week_days' => ['nullable', 'array'],
            'week_days.*.day' => ['required', 'string', 'in:'.$days],
            'week_days.*.time' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
        ];
    }
}
