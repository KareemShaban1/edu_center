<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StorePlatformAreaRequest;
use App\Http\Requests\Platform\UpdatePlatformAreaRequest;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformAreaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformAreasApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformAreaService $areaService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->areaService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $cityId = $request->query('city_id');

        return response()->json($this->areaService->list(
            is_numeric($cityId) ? (int) $cityId : null
        ));
    }

    public function store(StorePlatformAreaRequest $request): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->areaService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->areaService->store($request->validated());

        return response()->json(['ok' => true]);
    }

    public function update(UpdatePlatformAreaRequest $request, int $id): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->areaService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        if (! $this->areaService->update($id, $request->validated())) {
            return response()->json(['message' => 'Area not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->resolvePlatformContext($request)['error']) {
            return $err;
        }

        if (! $this->areaService->isAvailable()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $this->areaService->destroy($id);

        return response()->json(['ok' => true]);
    }
}
