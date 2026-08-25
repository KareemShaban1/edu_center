<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\SessionTypeHelper;
use Illuminate\Database\Connection;
use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class TeacherSessionService
{
    /**
     * @return array{token: string, url: string|null, room: string}
     */
    public function livekitToken(Connection $tenantDb, int $teacherId, int $sessionId, Collection $sectionIds): array
    {
        if (! LiveKitAccessTokenService::isConfigured()) {
            throw new HttpResponseException(
                response()->json(['message' => 'LiveKit is not configured'], 422)
            );
        }

        if ($sectionIds->isEmpty()) {
            throw new HttpResponseException(
                response()->json(['message' => 'Session not found'], 404)
            );
        }

        $row = $tenantDb->table('sessions')
            ->where('id', $sessionId)
            ->whereIn('section_id', $sectionIds)
            ->first();

        if (! $row || ($row->provider ?? '') !== 'livekit' || empty($row->room_slug)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Session not found'], 404)
            );
        }

        $token = LiveKitAccessTokenService::createToken(
            (string) $row->room_slug,
            'teacher-'.$teacherId,
            true,
            (bool) ($row->record_enabled ?? false)
        );

        return [
            'token' => $token,
            'url' => config('sessions.livekit.url'),
            'room' => $row->room_slug,
        ];
    }

    /**
     * @return array{sessions: Collection<int, array<string, mixed>>}
     */
    public function listSessions(Connection $tenantDb, Collection $sectionIds): array
    {
        if (! Schema::connection('center')->hasTable('sessions') || $sectionIds->isEmpty()) {
            return ['sessions' => collect()];
        }

        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');
        $hasGeoCol = Schema::connection('center')->hasColumn('sessions', 'latitude');

        $rows = $tenantDb->table('sessions')
            ->leftJoin('sections', 'sessions.section_id', '=', 'sections.id')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
            ->whereIn('sessions.section_id', $sectionIds)
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
        if ($hasGeoCol) {
            $rows->addSelect('sessions.latitude', 'sessions.longitude', 'sessions.geofence_radius_m');
        }

        $sessions = $rows->orderByDesc('sessions.start_at')->get()->map(function ($row) use ($hasLocationCol, $hasGeoCol) {
            $m = [
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
            ];
            if ($hasLocationCol) {
                $m['location'] = $row->location ?? '';
                $m['notes'] = $row->notes ?? '';
            }
            if ($hasGeoCol) {
                $m['latitude'] = $row->latitude !== null ? (float) $row->latitude : null;
                $m['longitude'] = $row->longitude !== null ? (float) $row->longitude : null;
                $m['geofence_radius_m'] = $row->geofence_radius_m !== null ? (int) $row->geofence_radius_m : null;
            }

            return $m;
        })->values();

        return ['sessions' => $sessions];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateSession(Connection $tenantDb, int $sessionId, array $payload, Collection $sectionIds): void
    {
        if (! Schema::connection('center')->hasTable('sessions') || $sectionIds->isEmpty()) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }

        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');
        $hasGeoCol = Schema::connection('center')->hasColumn('sessions', 'latitude');

        $existing = $tenantDb->table('sessions')->where('id', $sessionId)->first();
        if (! $existing || ! $sectionIds->contains((int) ($existing->section_id ?? 0))) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }

        $sectionId = (int) $payload['section_id'];
        if (! $sectionIds->contains($sectionId)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Section not allowed'], 422)
            );
        }

        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (! $section) {
            throw new HttpResponseException(
                response()->json(['message' => 'Section not found'], 404)
            );
        }
        $gradeId = (int) ($section->grade_id ?? 0);
        $classId = (int) ($section->class_id ?? 0);

        [$sessionType, $provider] = SessionTypeHelper::resolveFromPayload($payload);
        $urlProviders = ['external', 'zoom', 'microsoft_teams', 'google_meet'];
        if ($sessionType === 'online' && in_array((string) $provider, $urlProviders, true) && empty($payload['join_url'])) {
            throw new HttpResponseException(
                response()->json(['message' => 'join_url is required for this provider'], 422)
            );
        }
        if ($sessionType === 'offline' && empty($payload['location'])) {
            throw new HttpResponseException(
                response()->json(['message' => 'location is required for offline sessions'], 422)
            );
        }

        $update = [
            'grade_id' => $gradeId,
            'class_id' => $classId,
            'section_id' => $sectionId,
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
        if ($hasGeoCol) {
            if (array_key_exists('latitude', $payload)) {
                $update['latitude'] = $payload['latitude'] !== null ? round((float) $payload['latitude'], 7) : null;
            }
            if (array_key_exists('longitude', $payload)) {
                $update['longitude'] = $payload['longitude'] !== null ? round((float) $payload['longitude'], 7) : null;
            }
            if (array_key_exists('geofence_radius_m', $payload)) {
                $update['geofence_radius_m'] = $payload['geofence_radius_m'] !== null
                    ? (int) $payload['geofence_radius_m']
                    : null;
            }
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
                throw new HttpResponseException(
                    response()->json(['message' => 'LiveKit is not configured on the server'], 422)
                );
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
            $tenantDb->table('sessions')->where('id', $sessionId)->update($update);
        } catch (QueryException $e) {
            if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                throw new HttpResponseException(
                    response()->json(['message' => 'A session with this series and start time already exists.'], 422)
                );
            }

            throw $e;
        }
    }

    public function deleteSession(Connection $tenantDb, int $sessionId, Collection $sectionIds): void
    {
        if (! Schema::connection('center')->hasTable('sessions') || $sectionIds->isEmpty()) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }

        $deleted = $tenantDb->table('sessions')
            ->where('id', $sessionId)
            ->whereIn('section_id', $sectionIds)
            ->delete();

        if (! $deleted) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }
    }
}
