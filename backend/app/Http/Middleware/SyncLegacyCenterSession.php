<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Centers\CenterContextManager;
use Closure;
use Illuminate\Http\Request;

/**
 * After centers.id migrated from slug strings to integers, old sessions may still store api_tenant_id=demo.
 */
class SyncLegacyCenterSession
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->hasSession()) {
            $centerId = $request->session()->get('api_center_id')
                ?? $request->session()->get('api_tenant_id');

            if (is_string($centerId) && $centerId !== '' && ! is_numeric($centerId)) {
                $center = app(CenterContextManager::class)->resolveBySlug($centerId);
                if ($center) {
                    $request->session()->put('api_center_id', $center->id);
                    $request->session()->put('api_tenant_id', $center->id);
                    $request->session()->put('api_center_slug', $center->slug);
                    $request->session()->put('api_tenant_slug', $center->slug);
                }
            }
        }

        return $next($request);
    }
}
