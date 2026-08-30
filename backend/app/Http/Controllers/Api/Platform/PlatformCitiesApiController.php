<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StorePlatformCityRequest;
use App\Http\Requests\Platform\UpdatePlatformCityRequest;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformCityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformCitiesApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformCityService $cityService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->cityService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $governorateId = $request->query('governorate_id');

        return response()->json($this->cityService->list(
            is_numeric($governorateId) ? (int) $governorateId : null
        ));
    }

    public function store(StorePlatformCityRequest $request): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->cityService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->cityService->store($request->validated());

        return response()->json(['ok' => true]);
    }

    public function update(UpdatePlatformCityRequest $request, int $id): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->cityService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        if (! $this->cityService->update($id, $request->validated())) {
            return response()->json(['message' => 'City not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->cityService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->cityService->destroy($id);

        return response()->json(['ok' => true]);
    }
}
