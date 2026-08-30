<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StorePlatformGovernorateRequest;
use App\Http\Requests\Platform\UpdatePlatformGovernorateRequest;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformGovernorateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformGovernoratesApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformGovernorateService $governorateService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->governorateService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        return response()->json($this->governorateService->list());
    }

    public function store(StorePlatformGovernorateRequest $request): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->governorateService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->governorateService->store($request->validated());

        return response()->json(['ok' => true]);
    }

    public function update(UpdatePlatformGovernorateRequest $request, int $id): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->governorateService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        if (! $this->governorateService->update($id, $request->validated())) {
            return response()->json(['message' => 'Governorate not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->governorateService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->governorateService->destroy($id);

        return response()->json(['ok' => true]);
    }
}
