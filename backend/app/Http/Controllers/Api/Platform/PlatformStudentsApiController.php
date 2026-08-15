<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformStudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

final class PlatformStudentsApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformStudentService $studentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->studentService->list($conn));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! Schema::connection($conn)->hasTable('students')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $student = $this->studentService->show($conn, $id);
        if ($student === null) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        return response()->json($student);
    }
}
