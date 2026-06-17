<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Centers\CenterContextManager;
use Closure;
use Illuminate\Http\Request;

class InitializeCenterFromSubdomain
{
    public function handle(Request $request, Closure $next)
    {
        $centerContext = app(CenterContextManager::class);
        $host = $request->getHost();

        if (! in_array($host, config('centers.central_domains', []), true)) {
            $slug = explode('.', $host)[0];
            $center = $centerContext->resolveBySlug($slug);
            if ($center) {
                $centerContext->initialize($center);
            }
        }

        try {
            return $next($request);
        } finally {
            $centerContext->end();
        }
    }
}
