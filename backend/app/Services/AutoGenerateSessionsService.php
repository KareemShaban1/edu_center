<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\SectionWeekDays;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AutoGenerateSessionsService
{
    public function __construct(
        private readonly CenterSettingsService $settings,
    ) {}

    /**
     * @return array{created: int, skipped: int, sections: int, enabled: bool}
     */
    public function generateForCurrentCenter(bool $respectSetting = true, ?int $daysAhead = null): array
    {
        $config = $this->settings->sessionAutomation();
        if ($respectSetting && ! $config['enabled']) {
            return ['created' => 0, 'skipped' => 0, 'sections' => 0, 'enabled' => false];
        }

        if (! Schema::connection('center')->hasTable('sessions')
            || ! Schema::connection('center')->hasTable('sections')) {
            return ['created' => 0, 'skipped' => 0, 'sections' => 0, 'enabled' => $config['enabled']];
        }

        $days = $daysAhead ?? $config['days_ahead'];
        $days = max(1, min(60, $days));

        $sections = DB::connection('center')->table('sections')->get([
            'id',
            'grade_id',
            'class_id',
            'section_name',
            'week_days',
        ]);

        $created = 0;
        $skipped = 0;
        $sectionCount = 0;

        foreach ($sections as $section) {
            $weekDays = SectionWeekDays::decode($section->week_days ?? null);
            if ($weekDays === []) {
                continue;
            }
            $sectionCount++;
            $result = $this->generateForSectionRow($section, $weekDays, $days, $config);
            $created += $result['created'];
            $skipped += $result['skipped'];
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'sections' => $sectionCount,
            'enabled' => true,
        ];
    }

    /**
     * @param  object{id: mixed, grade_id: mixed, class_id: mixed, section_name?: mixed, week_days?: mixed}  $section
     * @param  array<int, array{day: string, time: string}>  $weekDays
     * @param  array<string, mixed>  $config
     * @return array{created: int, skipped: int}
     */
    private function generateForSectionRow(object $section, array $weekDays, int $daysAhead, array $config): array
    {
        $tz = (string) ($config['timezone'] ?: config('app.timezone', 'UTC'));
        $byDay = [];
        foreach ($weekDays as $slot) {
            $byDay[$slot['day']][] = $slot['time'];
        }

        $created = 0;
        $skipped = 0;
        $start = Carbon::now($tz)->startOfDay();
        $db = DB::connection('center');
        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');
        $sessionType = (string) $config['session_type'];
        $provider = (string) $config['provider'];
        $duration = (int) $config['duration'];
        $location = (string) ($config['location'] ?? '');
        $sectionId = (int) $section->id;
        $gradeId = (int) ($section->grade_id ?? 0);
        $classId = (int) ($section->class_id ?? 0);
        $sectionName = (string) ($section->section_name ?? 'Session');
        $topic = $sectionName;

        for ($i = 0; $i < $daysAhead; $i++) {
            $date = $start->copy()->addDays($i);
            $dayName = strtolower($date->englishDayOfWeek);
            $times = $byDay[$dayName] ?? [];
            foreach ($times as $time) {
                [$hour, $minute] = array_map('intval', explode(':', $time));
                $startAt = $date->copy()->setTime($hour, $minute, 0);
                $startAtStr = $startAt->format('Y-m-d H:i:s');

                $exists = $db->table('sessions')
                    ->where('section_id', $sectionId)
                    ->where('start_at', $startAtStr)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $row = [
                    'grade_id' => $gradeId,
                    'class_id' => $classId,
                    'section_id' => $sectionId,
                    'created_by' => 'System',
                    'topic' => $topic,
                    'start_at' => $startAtStr,
                    'duration' => $duration,
                    'session_type' => $sessionType,
                    'password' => null,
                    'record_enabled' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if ($sessionType === 'offline' || $provider === 'offline') {
                    $row['session_type'] = 'offline';
                    $row['provider'] = null;
                    $row['room_slug'] = null;
                    $row['join_url'] = '#';
                    $row['moderator_url'] = null;
                    $row['external_ref'] = null;
                } elseif ($provider === 'livekit') {
                    if (! LiveKitAccessTokenService::isConfigured()) {
                        // Fall back to jitsi if LiveKit is not configured.
                        $links = SessionLinkService::forJitsi();
                        $row['provider'] = 'jitsi';
                        $row['room_slug'] = $links['room_slug'];
                        $row['join_url'] = $links['join_url'];
                        $row['moderator_url'] = $links['moderator_url'];
                        $row['external_ref'] = null;
                    } else {
                        $slug = SessionLinkService::generateRoomSlug();
                        $links = SessionLinkService::forLiveKit($slug);
                        $row['provider'] = 'livekit';
                        $row['room_slug'] = $slug;
                        $row['join_url'] = $links['join_url'];
                        $row['moderator_url'] = $links['moderator_url'];
                        $row['external_ref'] = null;
                    }
                } else {
                    $links = SessionLinkService::forJitsi();
                    $row['provider'] = 'jitsi';
                    $row['room_slug'] = $links['room_slug'];
                    $row['join_url'] = $links['join_url'];
                    $row['moderator_url'] = $links['moderator_url'];
                    $row['external_ref'] = null;
                }

                if ($hasLocationCol) {
                    $row['location'] = $row['session_type'] === 'offline'
                        ? ($location !== '' ? $location : null)
                        : null;
                    $row['notes'] = 'Auto-generated from section week days';
                }

                if (Schema::connection('center')->hasColumn('sessions', 'center_id') && \App\Centers\CenterContext::id()) {
                    $row['center_id'] = \App\Centers\CenterContext::id();
                }

                $db->table('sessions')->insert($row);
                $created++;
            }
        }

        return ['created' => $created, 'skipped' => $skipped];
    }
}
