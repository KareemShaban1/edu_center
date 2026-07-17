<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Centers\CenterContext;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        $this->scopedDelete('settings');

        $centerName = CenterContext::center()?->name ?? 'Education Center';

        foreach ([
            ['key' => 'current_session', 'value' => '2025-2026'],
            ['key' => 'center_title', 'value' => substr($centerName, 0, 12)],
            ['key' => 'center_name', 'value' => $centerName],
            ['key' => 'end_first_term', 'value' => '01-12-2025'],
            ['key' => 'end_second_term', 'value' => '01-03-2026'],
            ['key' => 'phone', 'value' => '0123456789'],
            ['key' => 'address', 'value' => 'القاهرة'],
            ['key' => 'center_email', 'value' => 'info@educenter.com'],
            ['key' => 'logo', 'value' => '1.jpg'],
            ['key' => 'timezone', 'value' => 'Africa/Cairo'],
            ['key' => 'auto_generate_sessions', 'value' => '0'],
            ['key' => 'auto_session_days_ahead', 'value' => '14'],
            ['key' => 'auto_session_duration', 'value' => '60'],
            ['key' => 'auto_session_type', 'value' => 'offline'],
            ['key' => 'auto_session_provider', 'value' => 'offline'],
            ['key' => 'auto_session_location', 'value' => ''],
        ] as $row) {
            $this->insertScopedRow('settings', $row);
        }
    }
}
