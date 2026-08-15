<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformRoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformRolesApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformRoleService $roleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->roleService->list($conn));
    }
}
