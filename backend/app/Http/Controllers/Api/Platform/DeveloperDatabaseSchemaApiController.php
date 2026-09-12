<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Services\LiveDatabaseSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

final class DeveloperDatabaseSchemaApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function __construct(
        private readonly LiveDatabaseSchemaService $liveDatabaseSchemaService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        try {
            return response()->json($this->liveDatabaseSchemaService->catalog());
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not read live database schema.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function sync(Request $request): JsonResponse
    {
        if ($error = $this->platformAuthError($request)) {
            return $error;
        }

        try {
            $result = $this->liveDatabaseSchemaService->syncToDocs();

            return response()->json([
                'ok' => true,
                'message' => 'Database schema synced from live database.',
                'written' => array_map(
                    static fn (string $path): string => str_replace('\\', '/', $path),
                    $result['written'],
                ),
                'catalog' => $result['catalog'],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Could not sync database schema.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function platformAuthError(Request $request): ?JsonResponse
    {
        ['error' => $error] = $this->resolvePlatformContext($request);

        return $error;
    }
}
