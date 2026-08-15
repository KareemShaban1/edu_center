<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PostExamSectionDateRequest;
use App\Http\Support\ResolvesAdminApiContext;
use App\Http\Support\SectionDateHelper;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminExamsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly ExamService $examService,
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
        $payload = $this->examService->getSectionDate($sectionId, $date, $filterSessionId);

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

        $payload = $this->examService->getSectionHistory($sectionId);

        return response()->json($payload);
    }

    public function postSectionDate(PostExamSectionDateRequest $request, int $sectionId, string $date): JsonResponse
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

        $this->examService->saveSectionDate($sectionId, $date, $request->validated());

        return response()->json(['message' => 'Exam results saved']);
    }
}
