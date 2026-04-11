<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\URL;

class ForceUrlForTenant
{
    public function handle($request, Closure $next)
    {
        // Force URLs to use the current tenant's domain
        URL::forceRootUrl($request->getSchemeAndHttpHost());

        return $next($request);
    }
}
