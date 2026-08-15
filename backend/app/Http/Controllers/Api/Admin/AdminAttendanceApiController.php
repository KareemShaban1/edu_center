<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PostAttendanceSectionDateRequest;
use App\Http\Support\ResolvesAdminApiContext;
use App\Http\Support\SectionDateHelper;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminAttendanceApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly AttendanceService $attendanceService,
    ) {}

    public function sectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        if ($invalid = SectionDateHelper::invalidDateResponse($date)) {
            return $invalid;
        }

        $section = SectionDateHelper::findSection($sectionId);
        if (! $section) {
            return SectionDateHelper::sectionNotFoundResponse();
        }

        $filterSessionId = $request->query('session_id') ? (int) $request->query('session_id') : null;
        $payload = $this->attendanceService->getSectionDate($sectionId, $date, $filterSessionId);

        return response()->json([
            'date' => $payload['date'],
            'section' => SectionDateHelper::sectionPayload($section),
            'session_id' => $payload['session_id'],
            'session_options' => $payload['session_options'],
            'rows' => $payload['rows'],
        ]);
    }

    public function sectionHistory(Request $request, int $sectionId): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $section = SectionDateHelper::findSection($sectionId);
        if (! $section) {
            return SectionDateHelper::sectionNotFoundResponse();
        }

        $payload = $this->attendanceService->getSectionHistory($sectionId);

        return response()->json([
            'section' => SectionDateHelper::sectionPayload($section),
            'days' => $payload['days'],
        ]);
    }

    public function postSectionDate(PostAttendanceSectionDateRequest $request, int $sectionId, string $date): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        if ($invalid = SectionDateHelper::invalidDateResponse($date)) {
            return $invalid;
        }

        $section = SectionDateHelper::findSection($sectionId);
        if (! $section) {
            return SectionDateHelper::sectionNotFoundResponse();
        }

        $this->attendanceService->saveSectionDate(
            $sectionId,
            $date,
            $request->validated(),
            $request->boolean('notify', true),
        );

        return response()->json(['message' => 'Attendance saved']);
    }
}