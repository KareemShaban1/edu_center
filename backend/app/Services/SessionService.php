<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\SessionTypeHelper;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class SessionService
{
    public function __construct(
        private readonly AutoGenerateSessionsService $autoGenerateSessionsService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{message: string, generation: array<string, mixed>, status: int}
     */
    public function generate(array $payload): array
    {
        $result = $this->autoGenerateSessionsService->generateForCurrentCenter(
            respectSetting: empty($payload['force']),
            daysAhead: isset($payload['days_ahead']) ? (int) $payload['days_ahead'] : null,
        );

        if (! $result['enabled'] && empty($payload['force'])) {
            return [
                'message' => 'Automatic session generation is disabled in settings.',
                'generation' => $result,
                'status' => 422,
            ];
        }

        return [
            'message' => sprintf(
                'Generated %d session(s); skipped %d existing.',
                $result['created'],
                $result['skipped']
            ),
            'generation' => $result,
            'status' => 200,
        ];
    }

    /**
     * @return array{sessions: list<array<string, mixed>>}
     */
    public function list(): array
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return ['sessions' => []];
        }

        $tenantDb = DB::connection('center');
        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');

        $rows = $tenantDb->table('sessions')
            ->leftJoin('sections', 'sessions.section_id', '=', 'sections.id')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
            ->select(
                'sessions.id',
                'sessions.grade_id',
                'sessions.class_id',
                'sessions.section_id',
                'sessions.topic',
                'sessions.start_at',
                'sessions.duration',
                'sessions.session_type',
                'sessions.provider',
                'sessions.room_slug',
                'sessions.join_url',
                'sessions.moderator_url',
                'sessions.password',
                'sessions.record_enabled',
                'sessions.external_ref',
                'sessions.created_by',
                DB::raw("trim(concat_ws(' - ', nullif(grades.grade_name, ''), nullif(classes.class_name, ''), nullif(sections.section_name, ''))) as section_label")
            );

        if ($hasLocationCol) {
            $rows->addSelect('sessions.location', 'sessions.notes');
        }

        $sessions = $rows->orderByDesc('sessions.start_at')->get();
        $relatedIds = $this->sessionIdsWithRelatedRecords(
            $tenantDb,
            $sessions->pluck('id')->map(fn ($id) => (int) $id)->all(),
        );

        $mapped = $sessions->map(function ($row) use ($hasLocationCol, $relatedIds) {
            $session = [
                'id' => (int) $row->id,
                'grade_id' => (int) $row->grade_id,
                'class_id' => (int) $row->class_id,
                'section_id' => (int) $row->section_id,
                'section_label' => (string) ($row->section_label ?? ''),
                'topic' => (string) $row->topic,
                'start_at' => $row->start_at ? (string) $row->start_at : '',
                'duration' => (int) $row->duration,
                'session_type' => (string) ($row->session_type ?? 'online'),
                'provider' => (string) ($row->provider ?? ($row->session_type === 'offline' ? 'offline' : 'jitsi')),
                'room_slug' => $row->room_slug ?? null,
                'join_url' => $row->join_url ?? null,
                'moderator_url' => $row->moderator_url ?? null,
                'password' => $row->password ?? null,
                'record_enabled' => (bool) ($row->record_enabled ?? false),
                'external_ref' => $row->external_ref ?? null,
                'created_by' => (string) ($row->created_by ?? ''),
                'has_related' => $relatedIds->contains((int) $row->id),
            ];
            if ($hasLocationCol) {
                $session['location'] = $row->location ?? '';
                $session['notes'] = $row->notes ?? '';
            }

            return $session;
        })->values()->all();

        return ['sessions' => $mapped];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{ok?: true, message?: string, status: int}
     */
    public function create(array $payload, string $createdBy): array
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return ['message' => 'Module unavailable', 'status' => 422];
        }

        $tenantDb = DB::connection('center');
        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');

        $section = $tenantDb->table('sections')->where('id', (int) $payload['section_id'])->first();
        if (! $section) {
            return ['message' => 'Section not found', 'status' => 404];
        }

        [$sessionType, $provider] = SessionTypeHelper::resolveFromPayload($payload);
        if ($error = $this->validateSessionPayload($payload, $sessionType, $provider)) {
            return $error;
        }

        if ($this->sectionHasSessionOnDate($tenantDb, (int) $payload['section_id'], (string) $payload['start_at'])) {
            return ['message' => 'A session already exists for this section on this day.', 'status' => 422];
        }

        $base = [
            'grade_id' => (int) ($section->grade_id ?? 0),
            'class_id' => (int) ($section->class_id ?? 0),
            'section_id' => (int) $payload['section_id'],
            'created_by' => $createdBy,
            'topic' => (string) $payload['topic'],
            'start_at' => $payload['start_at'],
            'duration' => (int) $payload['duration'],
            'password' => $payload['password'] ?? null,
            'record_enabled' => (bool) ($payload['record_enabled'] ?? false),
            'session_type' => $sessionType,
            'provider' => $sessionType === 'online' ? $provider : null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasLocationCol) {
            $base['location'] = $payload['location'] ?? null;
            $base['notes'] = $payload['notes'] ?? null;
        }

        if ($sessionType === 'offline') {
            return $this->insertSession($tenantDb, $base, [
                'room_slug' => null,
                'join_url' => '#',
                'moderator_url' => null,
                'external_ref' => null,
                'password' => null,
            ]);
        }
        if (in_array($sessionType, ['exam', 'others'], true)) {
            return $this->insertSession($tenantDb, $base, [
                'room_slug' => null,
                'join_url' => (string) ($payload['join_url'] ?? '#'),
                'moderator_url' => $payload['moderator_url'] ?? null,
                'external_ref' => $payload['external_ref'] ?? null,
            ]);
        }
        if ($provider === 'jitsi') {
            $links = SessionLinkService::forJitsi();

            return $this->insertSession($tenantDb, $base, [
                'room_slug' => $links['room_slug'],
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'external_ref' => null,
            ]);
        }
        if ($provider === 'livekit') {
            if (! LiveKitAccessTokenService::isConfigured()) {
                return ['message' => 'LiveKit is not configured on the server', 'status' => 422];
            }
            $slug = SessionLinkService::generateRoomSlug();
            $links = SessionLinkService::forLiveKit($slug);

            return $this->insertSession($tenantDb, $base, [
                'room_slug' => $slug,
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'external_ref' => null,
            ]);
        }

        return $this->insertSession($tenantDb, $base, [
            'room_slug' => null,
            'join_url' => (string) $payload['join_url'],
            'moderator_url' => $payload['moderator_url'] ?? null,
            'external_ref' => $payload['external_ref'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{ok?: true, message?: string, status: int}
     */
    public function update(int $id, array $payload): array
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return ['message' => 'Module unavailable', 'status' => 422];
        }

        $tenantDb = DB::connection('center');
        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');

        $existing = $tenantDb->table('sessions')->where('id', $id)->first();
        if (! $existing) {
            return ['message' => 'Not found', 'status' => 404];
        }

        $section = $tenantDb->table('sections')->where('id', (int) $payload['section_id'])->first();
        if (! $section) {
            return ['message' => 'Section not found', 'status' => 404];
        }

        [$sessionType, $provider] = SessionTypeHelper::resolveFromPayload($payload);
        if ($error = $this->validateSessionPayload($payload, $sessionType, $provider)) {
            return $error;
        }

        if ($this->sectionHasSessionOnDate(
            $tenantDb,
            (int) $payload['section_id'],
            (string) $payload['start_at'],
            $id,
        )) {
            return ['message' => 'A session already exists for this section on this day.', 'status' => 422];
        }

        $update = [
            'grade_id' => (int) ($section->grade_id ?? 0),
            'class_id' => (int) ($section->class_id ?? 0),
            'section_id' => (int) $payload['section_id'],
            'topic' => (string) $payload['topic'],
            'start_at' => $payload['start_at'],
            'duration' => (int) $payload['duration'],
            'password' => $payload['password'] ?? null,
            'record_enabled' => (bool) ($payload['record_enabled'] ?? false),
            'session_type' => $sessionType,
            'provider' => $sessionType === 'online' ? $provider : null,
            'updated_at' => now(),
        ];
        if ($hasLocationCol) {
            $update['location'] = $payload['location'] ?? null;
            $update['notes'] = $payload['notes'] ?? null;
        }

        if ($sessionType === 'offline') {
            $update['room_slug'] = null;
            $update['join_url'] = '#';
            $update['moderator_url'] = null;
            $update['external_ref'] = null;
            $update['password'] = null;
        } elseif ($provider === 'jitsi') {
            if (($existing->provider ?? '') !== 'jitsi' || empty($existing->room_slug)) {
                $links = SessionLinkService::forJitsi();
                $update['room_slug'] = $links['room_slug'];
                $update['join_url'] = $links['join_url'];
                $update['moderator_url'] = $links['moderator_url'];
                $update['external_ref'] = null;
            }
        } elseif ($provider === 'livekit') {
            if (! LiveKitAccessTokenService::isConfigured()) {
                return ['message' => 'LiveKit is not configured on the server', 'status' => 422];
            }
            if (($existing->provider ?? '') !== 'livekit' || empty($existing->room_slug)) {
                $slug = SessionLinkService::generateRoomSlug();
                $links = SessionLinkService::forLiveKit($slug);
                $update['room_slug'] = $slug;
                $update['join_url'] = $links['join_url'];
                $update['moderator_url'] = $links['moderator_url'];
                $update['external_ref'] = null;
            }
        } else {
            $update['room_slug'] = null;
            $update['join_url'] = (string) $payload['join_url'];
            $update['moderator_url'] = $payload['moderator_url'] ?? null;
            $update['external_ref'] = $payload['external_ref'] ?? null;
        }

        try {
            $tenantDb->table('sessions')->where('id', $id)->update($update);
        } catch (QueryException $e) {
            if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                return ['message' => 'A session with this series and start time already exists.', 'status' => 422];
            }
            throw $e;
        }

        return ['ok' => true, 'status' => 200];
    }

    /**
     * @return array{ok?: true, message?: string, status: int}
     */
    public function delete(int $id): array
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return ['message' => 'Module unavailable', 'status' => 422];
        }

        $tenantDb = DB::connection('center');
        $exists = $tenantDb->table('sessions')->where('id', $id)->exists();
        if (! $exists) {
            return ['message' => 'Not found', 'status' => 404];
        }

        if ($this->sessionIdsWithRelatedRecords($tenantDb, [$id])->contains($id)) {
            return ['message' => 'Cannot delete a session that has attendance, quiz, or exam records', 'status' => 409];
        }

        $tenantDb->table('sessions')->where('id', $id)->delete();

        return ['ok' => true, 'status' => 200];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{message: string, status: int}|null
     */
    private function validateSessionPayload(array $payload, string $sessionType, ?string $provider): ?array
    {
        $urlProviders = ['external', 'zoom', 'microsoft_teams', 'google_meet'];
        if ($sessionType === 'online' && in_array((string) $provider, $urlProviders, true) && empty($payload['join_url'])) {
            return ['message' => 'join_url is required for this provider', 'status' => 422];
        }
        if ($sessionType === 'offline' && empty($payload['location'])) {
            return ['message' => 'location is required for offline sessions', 'status' => 422];
        }

        return null;
    }

    private function sectionHasSessionOnDate(
        \Illuminate\Database\Connection $tenantDb,
        int $sectionId,
        string $startAt,
        ?int $exceptId = null,
    ): bool {
        $date = substr($startAt, 0, 10);
        if ($date === '') {
            return false;
        }

        $query = $tenantDb->table('sessions')
            ->where('section_id', $sectionId)
            ->whereDate('start_at', $date);

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->exists();
    }

    /**
     * @param  list<int>  $sessionIds
     * @return \Illuminate\Support\Collection<int, int>
     */
    private function sessionIdsWithRelatedRecords(\Illuminate\Database\Connection $tenantDb, array $sessionIds): \Illuminate\Support\Collection
    {
        if ($sessionIds === []) {
            return collect();
        }

        $ids = collect();
        $tables = ['attendances', 'exam_degrees', 'quiz_degrees'];

        foreach ($tables as $table) {
            if (! Schema::connection('center')->hasTable($table)) {
                continue;
            }
            if (! Schema::connection('center')->hasColumn($table, 'session_id')) {
                continue;
            }

            $ids = $ids->merge(
                $tenantDb->table($table)
                    ->whereIn('session_id', $sessionIds)
                    ->whereNotNull('session_id')
                    ->distinct()
                    ->pluck('session_id')
            );
        }

        return $ids->map(static fn ($id) => (int) $id)->unique()->values();
    }

    /**
     * @param  array<string, mixed>  $base
     * @param  array<string, mixed>  $extra
     * @return array{ok?: true, message?: string, status: int}
     */
    private function insertSession(\Illuminate\Database\Connection $tenantDb, array $base, array $extra): array
    {
        try {
            $tenantDb->table('sessions')->insert(array_merge($base, $extra));

            return ['ok' => true, 'status' => 200];
        } catch (QueryException $e) {
            if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                return ['message' => 'A session with this series and start time already exists.', 'status' => 422];
            }
            throw $e;
        }
    }
}
