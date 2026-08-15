<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\AdminBootstrapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminBootstrapApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly AdminBootstrapService $bootstrapService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant, 'tenantDb' => $tenantDb] = $this->resolveAdminTenantGuardsContext($request);
        if ($error) {
            return $error;
        }

        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');

        return response()->json(
            $this->bootstrapService->build($tenantDb, $tenant, is_string($tenantSlug) ? $tenantSlug : null)
        );
    }
}
