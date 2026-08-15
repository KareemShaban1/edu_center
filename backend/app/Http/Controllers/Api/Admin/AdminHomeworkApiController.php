<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PostHomeworkCorrectionRequest;
use App\Http\Requests\Admin\StoreHomeworkRequest;
use App\Http\Requests\Admin\UpdateHomeworkRequest;
use App\Http\Requests\Admin\UpdateHomeworkSubmissionRequest;
use App\Http\Resources\HomeworkResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\HomeworkService;
use App\Services\HomeworkSubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminHomeworkApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly HomeworkService $homeworkService,
        private readonly HomeworkSubmissionService $submissionService,
    ) {}

    public function store(StoreHomeworkRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $homework = $this->homeworkService->create($request->validated());

        return response()->json([
            'homework' => HomeworkResource::make((object) $homework),
        ], 201);
    }

    public function update(UpdateHomeworkRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $homework = $this->homeworkService->update($id, $request->validated());

        return response()->json([
            'homework' => HomeworkResource::make((object) $homework),
        ]);
    }

    public function submissions(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->submissionService->listForHomework($tenantDb, $id);

        return response()->json([
            'homework' => HomeworkResource::make((object) $result['homework']),
            'submissions' => $result['submissions'],
        ]);
    }

    public function showSubmission(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->submissionService->show($tenantDb, $id);

        return response()->json([
            'homework' => HomeworkResource::make((object) $result['homework']),
            'submission' => $result['submission'],
        ]);
    }

    public function updateSubmissions(UpdateHomeworkSubmissionRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        return response()->json(
            $this->submissionService->update($tenantDb, $id, $request->validated())
        );
    }

    public function postSubmissionsCorrection(PostHomeworkCorrectionRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        return response()->json(
            $this->submissionService->uploadCorrection($tenantDb, $id, $request->file('correction'))
        );
    }
}
