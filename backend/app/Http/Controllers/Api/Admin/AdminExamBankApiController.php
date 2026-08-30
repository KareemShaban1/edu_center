<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateExamRequest;
use App\Http\Requests\Admin\ReorderExamQuestionsRequest;
use App\Http\Requests\Admin\StoreExamBankRequest;
use App\Http\Requests\Admin\UpdateExamBankRequest;
use App\Http\Requests\Admin\UpdateExamLayoutRequest;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\ExamBankService;
use App\Services\ExamExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminExamBankApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly ExamBankService $examBankService,
        private readonly ExamExportService $examExportService,
    ) {}

    public function store(StoreExamBankRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = $this->examBankService->create($request->validated(), $tenant);

        return response()->json(['exam' => $exam], 201);
    }

    public function update(UpdateExamBankRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = $this->examBankService->update($id, $request->validated(), $tenant);

        return response()->json(['exam' => $exam]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = $this->examBankService->find($id);

        return response()->json([
            'exam' => $this->examBankService->formatExam($exam),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $this->examBankService->delete($id);

        return response()->json(['message' => 'Exam deleted']);
    }

    public function generate(GenerateExamRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = $this->examBankService->generateFromLessons($request->validated(), $tenant);

        return response()->json(['exam' => $exam], 201);
    }

    public function reorderQuestions(ReorderExamQuestionsRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = $this->examBankService->reorderQuestions($id, $request->validated('question_ids'));

        return response()->json(['exam' => $exam]);
    }

    public function updateLayout(UpdateExamLayoutRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $exam = $this->examExportService->updateLayout($id, $request->validated());

        return response()->json(['exam' => $exam]);
    }

    public function export(Request $request, int $id, string $format)
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        return $this->examExportService->export($id, $format);
    }
}
