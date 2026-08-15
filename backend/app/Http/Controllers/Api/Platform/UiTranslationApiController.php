<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StoreUiTranslationRequest;
use App\Http\Requests\Platform\UpdateUiTranslationRequest;
use App\Http\Resources\UiTranslationResource;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\UiTranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class UiTranslationApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly UiTranslationService $translationService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(['translations' => $this->translationService->list()]);
    }

    public function store(StoreUiTranslationRequest $request): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        $item = $this->translationService->store($request->validated());

        return response()->json(UiTranslationResource::make($item), 201);
    }

    public function update(UpdateUiTranslationRequest $request, string $key): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        $item = $this->translationService->update($key, $request->validated());

        return response()->json(UiTranslationResource::make($item));
    }

    public function destroy(Request $request, string $key): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        $this->translationService->destroy($key);

        return response()->json(['ok' => true]);
    }

    private function platformAuthError(Request $request): ?JsonResponse
    {
        ['error' => $error] = $this->resolvePlatformContext($request);

        return $error;
    }
}
