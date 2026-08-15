<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesTeacherApiContext;
use App\Services\TeacherBootstrapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TeacherBootstrapApiController extends Controller
{
    use ResolvesTeacherApiContext;

    public function __construct(
        private readonly TeacherBootstrapService $bootstrapService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb, 'teacherId' => $teacherId] = $this->resolveTeacherContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->bootstrapService->build($tenantDb, $teacherId));
    }
}
