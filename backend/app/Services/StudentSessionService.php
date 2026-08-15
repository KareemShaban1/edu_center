<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Connection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Schema;

final class StudentSessionService
{
    /**
     * @return array{token: string, url: mixed, room: mixed}
     */
    public function livekitToken(Connection $tenantDb, int $sessionId, int $studentId, object $student): array
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }

        if (! LiveKitAccessTokenService::isConfigured()) {
            throw new HttpResponseException(
                response()->json(['message' => 'LiveKit is not configured'], 422)
            );
        }

        $row = $tenantDb->table('sessions')
            ->where('id', $sessionId)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->first();

        if (! $row || ($row->provider ?? '') !== 'livekit' || empty($row->room_slug)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Session not found'], 404)
            );
        }

        $identity = 'student-'.$studentId;
        $token = LiveKitAccessTokenService::createToken(
            (string) $row->room_slug,
            $identity,
            false,
            false
        );

        return [
            'token' => $token,
            'url' => config('sessions.livekit.url'),
            'room' => $row->room_slug,
        ];
    }
}
