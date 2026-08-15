<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentLibraryRequest;
use App\Http\Requests\Student\UpdateStudentLibraryRequest;
use App\Http\Support\ResolvesStudentApiContext;
use App\Services\StudentLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentLibraryApiController extends Controller
{
    use ResolvesStudentApiContext;

    public function __construct(
        private readonly StudentLibraryService $libraryService,
    ) {}

    public function store(StoreStudentLibraryRequest $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->libraryService->store($tenantDb, $student, $request->validated());

        return response()->json(['ok' => true]);
    }

    public function update(UpdateStudentLibraryRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->libraryService->update($tenantDb, $id, $student, $request->validated());

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        $this->libraryService->destroy($tenantDb, $id, $student);

        return response()->json(['ok' => true]);
    }
}
