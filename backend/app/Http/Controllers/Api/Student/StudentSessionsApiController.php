<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesStudentApiContext;
use App\Services\StudentSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentSessionsApiController extends Controller
{
    use ResolvesStudentApiContext;

    public function __construct(
        private readonly StudentSessionService $sessionService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Students can only view sessions.'], 403);
    }

    public function update(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Students can only view sessions.'], 403);
    }

    public function destroy(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Students can only view sessions.'], 403);
    }

    public function livekitToken(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'studentId' => $studentId, 'student' => $student] = $this->resolveStudentContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->sessionService->livekitToken($tenantDb, $id, $studentId, $student));
    }
}
