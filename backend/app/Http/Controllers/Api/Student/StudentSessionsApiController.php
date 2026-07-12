<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesStudentApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StudentSessionsApiController extends Controller
{
    use ResolvesStudentApiContext;
    public function store(Request $request): JsonResponse
    {
return response()->json(['message' => 'Students can only view sessions.'], 403);
    }

    public function update(Request $request): JsonResponse
    {
return response()->json(['message' => 'Students can only view sessions.'], 403);
    }

    public function destroy(Request $request): JsonResponse
    {
return response()->json(['message' => 'Students can only view sessions.'], 403);
    }

    public function livekitToken(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('sessions')) return response()->json(['message' => 'Module unavailable'], 422);
        if (! \App\Services\LiveKitAccessTokenService::isConfigured()) {
            return response()->json(['message' => 'LiveKit is not configured'], 422);
        }
        $row = $tenantDb->table('sessions')
            ->where('id', $id)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->first();
        if (!$row || ($row->provider ?? '') !== 'livekit' || empty($row->room_slug)) {
            return response()->json(['message' => 'Session not found'], 404);
        }
        $identity = 'student-'.$ctx['studentId'];
        $token = \App\Services\LiveKitAccessTokenService::createToken(
            (string) $row->room_slug,
            $identity,
            false,
            false
        );

        return response()->json([
            'token' => $token,
            'url' => config('sessions.livekit.url'),
            'room' => $row->room_slug,
        ]);
    }

}
