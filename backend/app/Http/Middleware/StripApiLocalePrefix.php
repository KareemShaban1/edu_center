<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * The React SPA calls /api/{locale}/... while Laravel routes are registered as /api/...
 * Strip the locale segment so existing API routes match.
 */
class StripApiLocalePrefix
{
    /** @var list<string> */
    private const LOCALES = ['en', 'ar'];

    public function handle(Request $request, Closure $next)
    {
        $uri = (string) $request->server->get('REQUEST_URI', '');
        $path = parse_url($uri, PHP_URL_PATH) ?? '';

        if (! preg_match('#^/api/('.implode('|', self::LOCALES).')(/.*)?$#', $path, $matches)) {
            return $next($request);
        }

        $rest = $matches[2] ?? '';
        if ($rest === '') {
            $rest = '/';
        }

        $newPath = '/api'.$rest;
        $query = parse_url($uri, PHP_URL_QUERY);
        $newUri = $newPath.($query ? '?'.$query : '');

        $request->server->set('REQUEST_URI', $newUri);
        app()->setLocale($matches[1]);

        return $next($request);
    }
}
