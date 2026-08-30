<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateExamRequest;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\GeneratedExam;
use App\Services\GeneratedExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminGeneratedExamsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly GeneratedExamService $generatedExamService,
    ) {}

    public function store(GenerateExamRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = $this->generatedExamService->generate($request->validated(), $tenant);

        return response()->json([
            'generated_exam' => $exam,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = GeneratedExam::query()
            ->with(['lessons', 'questions.answers'])
            ->find($id);

        if ($exam === null) {
            return response()->json(['message' => 'Generated exam not found'], 404);
        }

        return response()->json([
            'generated_exam' => $this->generatedExamService->formatExam($exam),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $this->generatedExamService->delete($id);

        return response()->json([
            'message' => 'Generated exam deleted',
        ]);
    }
}
