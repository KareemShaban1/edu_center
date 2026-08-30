<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\PlatformAreaService;
use App\Services\PlatformCityService;
use App\Services\PlatformGovernorateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminLocationsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly PlatformGovernorateService $governorateService,
        private readonly PlatformCityService $cityService,
        private readonly PlatformAreaService $areaService,
    ) {}

    public function governorates(Request $request): JsonResponse
    {
        if ($err = $this->resolveAdminWebContext($request)['error']) {
            return $err;
        }

        if (! $this->governorateService->isAvailable()) {
            return response()->json([]);
        }

        return response()->json($this->governorateService->list());
    }

    public function cities(Request $request): JsonResponse
    {
        if ($err = $this->resolveAdminWebContext($request)['error']) {
            return $err;
        }

        if (! $this->cityService->isAvailable()) {
            return response()->json([]);
        }

        $governorateId = $request->query('governorate_id');

        return response()->json($this->cityService->list(
            is_numeric($governorateId) ? (int) $governorateId : null
        ));
    }

    public function areas(Request $request): JsonResponse
    {
        if ($err = $this->resolveAdminWebContext($request)['error']) {
            return $err;
        }

        if (! $this->areaService->isAvailable()) {
            return response()->json([]);
        }

        $cityId = $request->query('city_id');

        return response()->json($this->areaService->list(
            is_numeric($cityId) ? (int) $cityId : null
        ));
    }
}
