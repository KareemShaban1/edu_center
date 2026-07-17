<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CenterSettingsService
{
    public const KEY_AUTO_GENERATE_SESSIONS = 'auto_generate_sessions';

    public const KEY_AUTO_SESSION_DAYS_AHEAD = 'auto_session_days_ahead';

    public const KEY_AUTO_SESSION_DURATION = 'auto_session_duration';

    public const KEY_AUTO_SESSION_TYPE = 'auto_session_type';

    public const KEY_AUTO_SESSION_PROVIDER = 'auto_session_provider';

    public const KEY_AUTO_SESSION_LOCATION = 'auto_session_location';

    public const KEY_TIMEZONE = 'timezone';

    /** @return array<string, string> */
    public function all(): array
    {
        if (! Schema::connection('center')->hasTable('settings')) {
            return $this->defaults();
        }

        $rows = DB::connection('center')->table('settings')->get(['key', 'value']);
        $map = $this->defaults();
        foreach ($rows as $row) {
            $map[(string) $row->key] = (string) ($row->value ?? '');
        }

        return $map;
    }

    public function get(string $key, ?string $default = null): ?string
    {
        if (! Schema::connection('center')->hasTable('settings')) {
            return $default ?? ($this->defaults()[$key] ?? null);
        }

        $value = DB::connection('center')->table('settings')->where('key', $key)->value('value');
        if ($value === null) {
            return $default ?? ($this->defaults()[$key] ?? null);
        }

        return (string) $value;
    }

    public function getBool(string $key, bool $default = false): bool
    {
        $value = strtolower(trim((string) ($this->get($key, $default ? '1' : '0') ?? '')));

        return in_array($value, ['1', 'true', 'yes', 'on'], true);
    }

    public function getInt(string $key, int $default): int
    {
        $value = $this->get($key, (string) $default);

        return is_numeric($value) ? (int) $value : $default;
    }

    public function put(string $key, string $value): void
    {
        if (! Schema::connection('center')->hasTable('settings')) {
            return;
        }

        $db = DB::connection('center');
        $existing = $db->table('settings')->where('key', $key)->first();
        $now = now();

        if ($existing) {
            $db->table('settings')->where('key', $key)->update([
                'value' => $value,
                'updated_at' => $now,
            ]);

            return;
        }

        $row = [
            'key' => $key,
            'value' => $value,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        if (Schema::connection('center')->hasColumn('settings', 'center_id') && \App\Centers\CenterContext::id()) {
            $row['center_id'] = \App\Centers\CenterContext::id();
        }

        $db->table('settings')->insert($row);
    }

    /** @param  array<string, string|int|bool|null>  $pairs */
    public function putMany(array $pairs): void
    {
        foreach ($pairs as $key => $value) {
            if ($value === null) {
                continue;
            }
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }
            $this->put((string) $key, (string) $value);
        }
    }

    /** @return array<string, string> */
    public function defaults(): array
    {
        return [
            'center_name' => '',
            'center_email' => '',
            'phone' => '',
            'address' => '',
            'current_session' => '',
            self::KEY_TIMEZONE => config('app.timezone', 'UTC'),
            self::KEY_AUTO_GENERATE_SESSIONS => '0',
            self::KEY_AUTO_SESSION_DAYS_AHEAD => '14',
            self::KEY_AUTO_SESSION_DURATION => '60',
            self::KEY_AUTO_SESSION_TYPE => 'offline',
            self::KEY_AUTO_SESSION_PROVIDER => 'offline',
            self::KEY_AUTO_SESSION_LOCATION => '',
        ];
    }

    /** @return array<string, mixed> */
    public function sessionAutomation(): array
    {
        $type = $this->get(self::KEY_AUTO_SESSION_TYPE, 'offline') ?: 'offline';
        $provider = $this->get(self::KEY_AUTO_SESSION_PROVIDER, 'offline') ?: 'offline';
        if ($type === 'offline') {
            $provider = 'offline';
        } elseif (! in_array($provider, ['jitsi', 'livekit'], true)) {
            $provider = 'jitsi';
        }

        return [
            'enabled' => $this->getBool(self::KEY_AUTO_GENERATE_SESSIONS, false),
            'days_ahead' => max(1, min(60, $this->getInt(self::KEY_AUTO_SESSION_DAYS_AHEAD, 14))),
            'duration' => max(15, min(480, $this->getInt(self::KEY_AUTO_SESSION_DURATION, 60))),
            'session_type' => in_array($type, ['offline', 'online'], true) ? $type : 'offline',
            'provider' => $provider,
            'location' => (string) ($this->get(self::KEY_AUTO_SESSION_LOCATION, '') ?? ''),
            'timezone' => (string) ($this->get(self::KEY_TIMEZONE, config('app.timezone', 'UTC')) ?? 'UTC'),
        ];
    }
}
