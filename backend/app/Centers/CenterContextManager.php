<?php

declare(strict_types=1);

namespace App\Centers;

use App\Models\Platform\Center;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class CenterContextManager
{
    public function connectionName(): string
    {
        return 'center';
    }

    public function resolveBySlug(?string $slug): ?Center
    {
        if (! $slug) {
            return null;
        }

        return Center::query()->where('slug', $slug)->first();
    }

    public function resolveFromRequest(Request $request): ?Center
    {
        $centerId = $request->session()->get('api_center_id')
            ?? $request->session()->get('api_tenant_id')
            ?? $request->header('X-Center-Id')
            ?? $request->header('X-Tenant-Id');

        $slug = $request->session()->get('api_center_slug')
            ?? $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Center-Slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('center_slug')
            ?? $request->query('tenant_slug');

        if ($centerId) {
            return Center::query()->find($centerId);
        }

        return $this->resolveBySlug(is_string($slug) ? $slug : null);
    }

    public function initialize(?Center $center): void
    {
        if (! $center) {
            return;
        }

        CenterContext::set($center);

        $defaultConnection = (string) config('database.default', 'mysql');
        $database = config("database.connections.{$defaultConnection}.database");

        Config::set('database.connections.center', array_merge(
            config('database.connections.center', []),
            array_merge(
                config("database.connections.{$defaultConnection}", []),
                [
                    'driver' => 'mysql',
                    'database' => $database,
                ]
            )
        ));

        DB::purge('center');
        DB::reconnect('center');
    }

    public function end(): void
    {
        CenterContext::clear();
    }

    public function centerConnection()
    {
        return DB::connection('center');
    }
}
