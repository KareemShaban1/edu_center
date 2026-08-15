<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentHomeworkSubmissionRequest;
use App\Http\Requests\Student\UpdateStudentHomeworkSubmissionRequest;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesStudentApiContext;
use App\Services\StudentHomeworkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentHomeworkApiController extends Controller
{
    use ResolvesStudentApiContext;

    public function __construct(
        private readonly StudentHomeworkService $homeworkService,
    ) {}

    public function submissions(StoreStudentHomeworkSubmissionRequest $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $centerId = StudentHomeworkService::resolveCenterId(
            $request->input('center_id') ? (int) $request->input('center_id') : null,
            $request->session()->get('api_tenant_id') ? (int) $request->session()->get('api_tenant_id') : null,
        );

        $result = $this->homeworkService->createSubmission(
            $tenantDb,
            $studentId,
            $student,
            $request->validated(),
            AdminUploadHelper::validatedFiles($request),
            $centerId,
        );

        return response()->json(['ok' => true, 'id' => $result['id']]);
    }

    public function postSubmissions(UpdateStudentHomeworkSubmissionRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'studentId' => $studentId, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $centerId = StudentHomeworkService::resolveCenterId(
            $request->input('center_id') ? (int) $request->input('center_id') : null,
            $request->session()->get('api_tenant_id') ? (int) $request->session()->get('api_tenant_id') : null,
        );

        $this->homeworkService->updateSubmissionWithMedia(
            $id,
            $studentId,
            $student,
            $request->validated(),
            AdminUploadHelper::validatedFiles($request),
            $centerId,
        );

        return response()->json(['ok' => true]);
    }

    public function updateSubmissions(UpdateStudentHomeworkSubmissionRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'studentId' => $studentId] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $centerId = StudentHomeworkService::resolveCenterId(
            $request->input('center_id') ? (int) $request->input('center_id') : null,
            $request->session()->get('api_tenant_id') ? (int) $request->session()->get('api_tenant_id') : null,
        );

        $this->homeworkService->updateSubmission(
            $id,
            $studentId,
            $request->validated(),
            $centerId,
        );

        return response()->json(['ok' => true]);
    }

    public function destroySubmissions(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'studentId' => $studentId] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->homeworkService->deleteSubmission($id, $studentId);

        return response()->json(['ok' => true]);
    }
}
