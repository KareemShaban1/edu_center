<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformParentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

final class PlatformParentsApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformParentService $parentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->parentService->list($conn));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! Schema::connection($conn)->hasTable('parents')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $parent = $this->parentService->show($conn, $id);
        if ($parent === null) {
            return response()->json(['message' => 'Parent not found'], 404);
        }

        return response()->json($parent);
    }
}
