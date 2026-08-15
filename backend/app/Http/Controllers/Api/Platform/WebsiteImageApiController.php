<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\UpdateWebsiteImageRequest;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\WebsiteImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WebsiteImageApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly WebsiteImageService $websiteImageService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(['images' => (object) $this->websiteImageService->overrides()]);
    }

    public function update(UpdateWebsiteImageRequest $request, string $key): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        return response()->json(
            $this->websiteImageService->update($key, $request->file('image')),
        );
    }

    public function destroy(Request $request, string $key): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        $this->websiteImageService->destroy($key);

        return response()->json(['ok' => true]);
    }

    private function platformAuthError(Request $request): ?JsonResponse
    {
        ['error' => $error] = $this->resolvePlatformContext($request);

        return $error;
    }
}
