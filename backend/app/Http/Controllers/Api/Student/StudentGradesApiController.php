<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentGradeRequest;
use App\Http\Requests\Student\UpdateStudentGradeRequest;
use App\Http\Support\ResolvesStudentApiContext;
use App\Services\StudentGradesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentGradesApiController extends Controller
{
    use ResolvesStudentApiContext;

    public function __construct(
        private readonly StudentGradesService $gradesService,
    ) {}

    public function store(StoreStudentGradeRequest $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->gradesService->store($tenantDb, $studentId, $student, $request->validated());

        return response()->json(['ok' => true]);
    }

    public function update(UpdateStudentGradeRequest $request, string $source, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->gradesService->update($tenantDb, $source, $id, $studentId, $request->validated());

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, string $source, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->gradesService->destroy($tenantDb, $source, $id, $studentId);

        return response()->json(['ok' => true]);
    }
}
