<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PlatformActivityLogsApiController extends Controller
{
    use ResolvesPlatformApiContext;
    public function index(Request $request): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $tenantLogs = DB::connection($conn)->table('tenant_infos')
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get(['id', 'tenant_id', 'name', 'status', 'updated_at'])
            ->map(function ($row) {
                $status = ((int) $row->status) === 1 ? 'active' : (((int) $row->status) === 2 ? 'suspended' : 'inactive');
                return [
                    'id' => (int) $row->id,
                    'description' => 'Tenant ' . $row->name . ' is ' . $status,
                    'causer_id' => null,
                    'created_at' => optional($row->updated_at)->format('Y-m-d H:i:s') ?? now()->toDateTimeString(),
                ];
            });
        $adminLogs = Schema::connection($conn)->hasTable('admins')
            ? DB::connection($conn)->table('admins')
                ->orderByDesc('updated_at')
                ->limit(100)
                ->get(['id', 'name', 'updated_at'])
                ->map(function ($row) {
                    return [
                        'id' => 100000 + (int) $row->id,
                        'description' => 'Platform user updated: ' . $row->name,
                        'causer_id' => (int) $row->id,
                        'created_at' => optional($row->updated_at)->format('Y-m-d H:i:s') ?? now()->toDateTimeString(),
                    ];
                })
            : collect();
        return response()->json($tenantLogs->merge($adminLogs)->sortByDesc('created_at')->take(200)->values());
    }

}
