<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\UiIconService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class UiIconApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly UiIconService $uiIconService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(['icons' => (object) $this->uiIconService->overrides()]);
    }

    public function update(Request $request): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        $payload = $request->validate([
            'icons' => ['required', 'array'],
            'icons.*' => ['required', 'string', 'max:80'],
        ]);

        return response()->json([
            'icons' => (object) $this->uiIconService->save($payload['icons']),
        ]);
    }

    public function updateOne(Request $request, string $key): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        $payload = $request->validate([
            'icon' => ['required', 'string', 'max:80'],
        ]);

        return response()->json([
            'icons' => (object) $this->uiIconService->updateOne($key, $payload['icon']),
        ]);
    }

    public function destroy(Request $request, string $key): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        return response()->json([
            'icons' => (object) $this->uiIconService->destroy($key),
        ]);
    }

    private function platformAuthError(Request $request): ?JsonResponse
    {
        ['error' => $error] = $this->resolvePlatformContext($request);

        return $error;
    }
}
