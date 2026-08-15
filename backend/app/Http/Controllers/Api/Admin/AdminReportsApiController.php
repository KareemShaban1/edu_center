<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\AdminReportsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminReportsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly AdminReportsService $reportsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->reportsService->index($tenantDb));
    }

    public function show(Request $request, string $type): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        return response()->json($this->reportsService->show($tenantDb, $request, $type));
    }
}
