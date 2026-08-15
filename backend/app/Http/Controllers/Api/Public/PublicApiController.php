<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Services\PublicApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PublicApiController extends Controller
{
    public function __construct(
        private readonly PublicApiService $publicApiService,
    ) {}

    public function centers(Request $request): JsonResponse
    {
        return response()->json($this->publicApiService->centers());
    }

    public function centerAcademic(Request $request, string $slug): JsonResponse
    {
        $payload = $this->publicApiService->centerAcademic($slug);
        if ($payload === null) {
            return response()->json(['message' => 'Center not found'], 404);
        }

        return response()->json($payload);
    }

    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->publicApiService->stats());
    }
}
