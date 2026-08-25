<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\CheckInAttendanceRequest;
use App\Http\Requests\Student\StoreStudentAttendanceRequest;
use App\Http\Requests\Student\UpdateStudentAttendanceRequest;
use App\Http\Support\ResolvesStudentApiContext;
use App\Services\AttendanceQrService;
use App\Services\StudentAttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentAttendanceApiController extends Controller
{
    use ResolvesStudentApiContext;

    public function __construct(
        private readonly StudentAttendanceService $attendanceService,
        private readonly AttendanceQrService $attendanceQrService,
    ) {}

    public function checkIn(CheckInAttendanceRequest $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->attendanceQrService->checkIn($tenantDb, (int) $studentId, $student, $request->validated());

        return response()->json($result);
    }

    public function store(StoreStudentAttendanceRequest $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->attendanceService->store($tenantDb, $studentId, $student, $request->validated());

        return response()->json(['ok' => true]);
    }

    public function update(UpdateStudentAttendanceRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->attendanceService->update($tenantDb, $id, $studentId, $request->validated());

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->attendanceService->destroy($tenantDb, $id, $studentId);

        return response()->json(['ok' => true]);
    }
}
