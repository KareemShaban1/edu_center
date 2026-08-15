<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StorePlatformUserRequest;
use App\Http\Requests\Platform\UpdatePlatformUserRequest;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformUsersApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformUserService $userService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->userService->list($conn));
    }

    public function store(StorePlatformUserRequest $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! $this->userService->isAvailable($conn)) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->userService->store($conn, $request->validated());

        return response()->json(['ok' => true]);
    }

    public function update(UpdatePlatformUserRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! $this->userService->isAvailable($conn)) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        if (! $this->userService->update($conn, $id, $request->validated())) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! $this->userService->isAvailable($conn)) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->userService->destroy($conn, $id);

        return response()->json(['ok' => true]);
    }
}
