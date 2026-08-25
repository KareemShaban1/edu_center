<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\UpdateSessionAttendanceVenueRequest;
use App\Http\Requests\Teacher\UpdateTeacherSessionRequest;
use App\Http\Support\ResolvesTeacherApiContext;
use App\Services\AttendanceQrService;
use App\Services\TeacherSectionService;
use App\Services\TeacherSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TeacherSessionsApiController extends Controller
{
    use ResolvesTeacherApiContext;

    public function __construct(
        private readonly TeacherSessionService $teacherSessionService,
        private readonly TeacherSectionService $teacherSectionService,
        private readonly AttendanceQrService $attendanceQrService,
    ) {}

    public function livekitToken(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'teacherId' => $teacherId] = $this->resolveTeacherContext($request);
        if ($error) {
            return $error;
        }

        $sectionIds = $this->teacherSectionService->sectionIds($tenantDb, $teacherId);
        $result = $this->teacherSessionService->livekitToken($tenantDb, $teacherId, $id, $sectionIds);

        return response()->json($result);
    }

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'teacherId' => $teacherId] = $this->resolveTeacherContext($request);
        if ($error) {
            return $error;
        }

        $sectionIds = $this->teacherSectionService->sectionIds($tenantDb, $teacherId);
        $result = $this->teacherSessionService->listSessions($tenantDb, $sectionIds);

        return response()->json(['sessions' => $result['sessions']]);
    }

    public function update(UpdateTeacherSessionRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'teacherId' => $teacherId] = $this->resolveTeacherContext($request);
        if ($error) {
            return $error;
        }

        $sectionIds = $this->teacherSectionService->sectionIds($tenantDb, $teacherId);
        $this->teacherSessionService->updateSession($tenantDb, $id, $request->validated(), $sectionIds);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'teacherId' => $teacherId] = $this->resolveTeacherContext($request);
        if ($error) {
            return $error;
        }

        $sectionIds = $this->teacherSectionService->sectionIds($tenantDb, $teacherId);
        $this->teacherSessionService->deleteSession($tenantDb, $id, $sectionIds);

        return response()->json(['ok' => true]);
    }

    public function attendanceQr(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'teacherId' => $teacherId] = $this->resolveTeacherContext($request);
        if ($error) {
            return $error;
        }

        $sectionIds = $this->teacherSectionService->sectionIds($tenantDb, $teacherId)->all();
        $token = $this->attendanceQrService->issueToken($tenantDb, $id, $sectionIds);

        return response()->json($token);
    }

    public function attendanceVenue(UpdateSessionAttendanceVenueRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'teacherId' => $teacherId] = $this->resolveTeacherContext($request);
        if ($error) {
            return $error;
        }

        $sectionIds = $this->teacherSectionService->sectionIds($tenantDb, $teacherId)->all();
        $venue = $this->attendanceQrService->updateVenue($tenantDb, $id, $request->validated(), $sectionIds);

        return response()->json(['venue' => $venue]);
    }
}
