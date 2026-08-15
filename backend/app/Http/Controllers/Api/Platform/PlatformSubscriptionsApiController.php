<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StorePlatformSubscriptionRequest;
use App\Http\Requests\Platform\UpdatePlatformSubscriptionRequest;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\PlatformSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PlatformSubscriptionsApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly PlatformSubscriptionService $subscriptionService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->subscriptionService->list($conn));
    }

    public function store(StorePlatformSubscriptionRequest $request): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! $this->subscriptionService->store($conn, $request->validated())) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function update(UpdatePlatformSubscriptionRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! $this->subscriptionService->update($conn, $id, $request->validated())) {
            return response()->json(['message' => 'Subscription not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'centralConnection' => $conn] = $this->resolvePlatformContext($request);
        if ($error) {
            return $error;
        }

        if (! $this->subscriptionService->cancel($conn, $id)) {
            return response()->json(['message' => 'Subscription not found'], 404);
        }

        return response()->json(['ok' => true]);
    }
}
