<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterContext;
use Carbon\Carbon;
use Illuminate\Database\Connection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Schema;

final class AttendanceQrService
{
    public const WINDOW_SECONDS = 30;

    public const DEFAULT_GEOFENCE_RADIUS_M = 150;

    public const EARLY_MINUTES = 15;

    public const LATE_AFTER_MINUTES = 15;

    public const MAX_GPS_ACCURACY_M = 200;

    /**
     * @return array{
     *   session_id: int,
     *   topic: string,
     *   start_at: string,
     *   duration: int,
     *   section_id: int,
     *   window_seconds: int,
     *   expires_in: int,
     *   payload: string,
     *   venue: array{latitude: ?float, longitude: ?float, geofence_radius_m: ?int, location: string, configured: bool}
     * }
     */
    public function issueToken(Connection $tenantDb, int $sessionId, ?array $allowedSectionIds = null): array
    {
        $session = $this->findSession($tenantDb, $sessionId, $allowedSectionIds);
        $centerId = (int) (CenterContext::id() ?? 0);
        $now = time();
        $window = intdiv($now, self::WINDOW_SECONDS);
        $expiresIn = self::WINDOW_SECONDS - ($now % self::WINDOW_SECONDS);
        if ($expiresIn === 0) {
            $expiresIn = self::WINDOW_SECONDS;
        }

        $token = $this->sign($centerId, $sessionId, $window);
        $payload = json_encode([
            'v' => 1,
            'c' => $centerId,
            's' => $sessionId,
            'w' => $window,
            't' => $token,
        ], JSON_UNESCAPED_SLASHES);

        return [
            'session_id' => $sessionId,
            'topic' => (string) ($session->topic ?? ''),
            'start_at' => $session->start_at ? (string) $session->start_at : '',
            'duration' => (int) ($session->duration ?? 0),
            'section_id' => (int) ($session->section_id ?? 0),
            'window_seconds' => self::WINDOW_SECONDS,
            'expires_in' => $expiresIn,
            'payload' => $payload ?: '',
            'venue' => $this->venueFromSession($session),
        ];
    }

    /**
     * @param  array{latitude: float, longitude: float, geofence_radius_m?: int|null}  $payload
     * @return array{latitude: float, longitude: float, geofence_radius_m: int, location: string, configured: bool}
     */
    public function updateVenue(Connection $tenantDb, int $sessionId, array $payload, ?array $allowedSectionIds = null): array
    {
        $session = $this->findSession($tenantDb, $sessionId, $allowedSectionIds);
        if (! Schema::connection('center')->hasColumn('sessions', 'latitude')) {
            throw new HttpResponseException(
                response()->json(['message' => 'QR attendance is not available yet. Run migrations.'], 422)
            );
        }

        $radius = isset($payload['geofence_radius_m'])
            ? (int) $payload['geofence_radius_m']
            : (int) ($session->geofence_radius_m ?? self::DEFAULT_GEOFENCE_RADIUS_M);
        $radius = max(30, min(1000, $radius > 0 ? $radius : self::DEFAULT_GEOFENCE_RADIUS_M));

        $tenantDb->table('sessions')->where('id', $sessionId)->update([
            'latitude' => round((float) $payload['latitude'], 7),
            'longitude' => round((float) $payload['longitude'], 7),
            'geofence_radius_m' => $radius,
            'updated_at' => now(),
        ]);

        $fresh = $this->findSession($tenantDb, $sessionId, $allowedSectionIds);

        return $this->venueFromSession($fresh);
    }

    /**
     * @param  array{
     *   payload: string,
     *   latitude: float,
     *   longitude: float,
     *   accuracy_m?: float|null
     * }  $input
     * @return array{status: string, attendance_id: int, checked_in_at: string, distance_m: float|null}
     */
    public function checkIn(Connection $tenantDb, int $studentId, object $student, array $input): array
    {
        if (! Schema::connection('center')->hasColumn('attendances', 'checked_in_at')) {
            throw new HttpResponseException(
                response()->json(['message' => 'QR attendance is not available yet. Run migrations.'], 422)
            );
        }

        $decoded = $this->decodePayload((string) $input['payload']);
        $sessionId = (int) $decoded['s'];
        $window = (int) $decoded['w'];
        $token = (string) $decoded['t'];
        $tokenCenterId = (int) ($decoded['c'] ?? 0);
        $centerId = (int) (CenterContext::id() ?? 0);

        if ($tokenCenterId > 0 && $centerId > 0 && $tokenCenterId !== $centerId) {
            throw new HttpResponseException(
                response()->json(['message' => 'This QR code belongs to another center.'], 422)
            );
        }

        if (! $this->tokenIsValid($centerId > 0 ? $centerId : $tokenCenterId, $sessionId, $window, $token)) {
            throw new HttpResponseException(
                response()->json(['message' => 'QR code expired. Ask your teacher to show the live code again.'], 422)
            );
        }

        $session = $this->findSession($tenantDb, $sessionId);
        $studentSectionId = (int) ($student->section_id ?? 0);
        if ($studentSectionId <= 0 || $studentSectionId !== (int) ($session->section_id ?? 0)) {
            throw new HttpResponseException(
                response()->json(['message' => 'You are not enrolled in this session section.'], 403)
            );
        }

        $this->assertWithinCheckInWindow($session);

        $lat = (float) $input['latitude'];
        $lng = (float) $input['longitude'];
        $accuracy = isset($input['accuracy_m']) && $input['accuracy_m'] !== null
            ? (float) $input['accuracy_m']
            : null;

        if ($accuracy !== null && $accuracy > self::MAX_GPS_ACCURACY_M) {
            throw new HttpResponseException(
                response()->json(['message' => 'GPS accuracy is too low. Move near a window or outdoors and try again.'], 422)
            );
        }

        $venue = $this->venueFromSession($session);
        if (! $venue['configured']) {
            throw new HttpResponseException(
                response()->json(['message' => 'Session venue is not set. Teacher must set location before QR check-in.'], 422)
            );
        }

        $distance = $this->haversineMeters(
            (float) $venue['latitude'],
            (float) $venue['longitude'],
            $lat,
            $lng,
        );
        $radius = (int) ($venue['geofence_radius_m'] ?? self::DEFAULT_GEOFENCE_RADIUS_M);
        if ($distance > $radius) {
            throw new HttpResponseException(
                response()->json([
                    'message' => 'You are outside the allowed attendance area.',
                    'distance_m' => round($distance, 1),
                    'allowed_m' => $radius,
                ], 422)
            );
        }

        $status = $this->resolveStatus($session);
        $statusCode = $status === 'late' ? 2 : 1;
        $now = now();
        $date = Carbon::parse((string) $session->start_at)->toDateString();

        $existing = $tenantDb->table('attendances')
            ->where('student_id', $studentId)
            ->where('session_id', $sessionId)
            ->first();

        if (! $existing) {
            $existing = $tenantDb->table('attendances')
                ->where('student_id', $studentId)
                ->whereDate('attendance_date', $date)
                ->when(
                    Schema::connection('center')->hasColumn('attendances', 'session_id'),
                    fn ($q) => $q->where(function ($inner) use ($sessionId): void {
                        $inner->whereNull('session_id')->orWhere('session_id', $sessionId);
                    })
                )
                ->first();
        }

        if ($existing && (int) ($existing->attendance_status ?? 0) !== 0 && ! empty($existing->checked_in_at)) {
            throw new HttpResponseException(
                response()->json(['message' => 'You already checked in for this session.'], 409)
            );
        }

        $data = [
            'student_id' => $studentId,
            'grade_id' => (int) ($student->grade_id ?? $session->grade_id ?? 0),
            'class_id' => (int) ($student->class_id ?? $session->class_id ?? 0),
            'section_id' => $studentSectionId,
            'session_id' => $sessionId,
            'attendance_date' => $date,
            'attendance_status' => $statusCode,
            'checked_in_at' => $now,
            'check_in_latitude' => round($lat, 7),
            'check_in_longitude' => round($lng, 7),
            'check_in_accuracy_m' => $accuracy !== null ? round($accuracy, 2) : null,
            'check_in_distance_m' => round($distance, 2),
            'check_in_method' => 'qr',
            'updated_at' => $now,
        ];

        if ($existing) {
            $tenantDb->table('attendances')->where('id', $existing->id)->update($data);
            $attendanceId = (int) $existing->id;
        } else {
            $data['created_at'] = $now;
            $attendanceId = (int) $tenantDb->table('attendances')->insertGetId($data);
        }

        return [
            'status' => $status,
            'attendance_id' => $attendanceId,
            'checked_in_at' => $now->toIso8601String(),
            'distance_m' => round($distance, 1),
        ];
    }

    /**
     * @return array{latitude: ?float, longitude: ?float, geofence_radius_m: ?int, location: string, configured: bool}
     */
    private function venueFromSession(object $session): array
    {
        $lat = isset($session->latitude) && $session->latitude !== null ? (float) $session->latitude : null;
        $lng = isset($session->longitude) && $session->longitude !== null ? (float) $session->longitude : null;

        return [
            'latitude' => $lat,
            'longitude' => $lng,
            'geofence_radius_m' => isset($session->geofence_radius_m) && $session->geofence_radius_m !== null
                ? (int) $session->geofence_radius_m
                : null,
            'location' => (string) ($session->location ?? ''),
            'configured' => $lat !== null && $lng !== null,
        ];
    }

    /**
     * @param  list<int>|null  $allowedSectionIds
     */
    private function findSession(Connection $tenantDb, int $sessionId, ?array $allowedSectionIds = null): object
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Sessions module unavailable'], 422)
            );
        }

        $query = $tenantDb->table('sessions')->where('id', $sessionId);
        if ($allowedSectionIds !== null) {
            if ($allowedSectionIds === []) {
                throw new HttpResponseException(response()->json(['message' => 'Session not found'], 404));
            }
            $query->whereIn('section_id', $allowedSectionIds);
        }

        $session = $query->first();
        if (! $session) {
            throw new HttpResponseException(response()->json(['message' => 'Session not found'], 404));
        }

        return $session;
    }

    /**
     * @return array{v: int, c?: int, s: int, w: int, t: string}
     */
    private function decodePayload(string $payload): array
    {
        $data = json_decode($payload, true);
        if (! is_array($data) || ! isset($data['s'], $data['w'], $data['t'])) {
            throw new HttpResponseException(
                response()->json(['message' => 'Invalid QR code.'], 422)
            );
        }

        return $data;
    }

    private function tokenIsValid(int $centerId, int $sessionId, int $window, string $token): bool
    {
        $current = intdiv(time(), self::WINDOW_SECONDS);
        foreach ([$current, $current - 1] as $candidate) {
            if ($candidate === $window && hash_equals($this->sign($centerId, $sessionId, $candidate), $token)) {
                return true;
            }
        }

        return false;
    }

    private function sign(int $centerId, int $sessionId, int $window): string
    {
        $key = (string) config('app.key');
        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7)) ?: $key;
        }

        return hash_hmac('sha256', "attendance-qr|{$centerId}|{$sessionId}|{$window}", $key);
    }

    private function assertWithinCheckInWindow(object $session): void
    {
        if (empty($session->start_at)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Session start time is missing.'], 422)
            );
        }

        $start = Carbon::parse((string) $session->start_at);
        $duration = max(1, (int) ($session->duration ?? 60));
        $earliest = $start->copy()->subMinutes(self::EARLY_MINUTES);
        $latest = $start->copy()->addMinutes($duration + 30);
        $now = now();

        if ($now->lt($earliest)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Check-in is not open yet for this session.'], 422)
            );
        }
        if ($now->gt($latest)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Check-in window for this session has closed.'], 422)
            );
        }
    }

    private function resolveStatus(object $session): string
    {
        $start = Carbon::parse((string) $session->start_at);
        $lateAfter = $start->copy()->addMinutes(self::LATE_AFTER_MINUTES);

        return now()->gt($lateAfter) ? 'late' : 'present';
    }

    private function haversineMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earth = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2 * $earth * asin(min(1, sqrt($a)));
    }
}
