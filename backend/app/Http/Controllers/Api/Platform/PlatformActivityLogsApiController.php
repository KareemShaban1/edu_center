<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformActivityLogsApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformActivityLogService $activityLogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->activityLogService->list($conn));
    }
}
