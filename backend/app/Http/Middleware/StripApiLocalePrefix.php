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
        $path = $request->getPathInfo();

        if (! preg_match('#^/api/('.implode('|', self::LOCALES).')(/.*)?$#', $path, $matches)) {
            return $next($request);
        }

        $rest = $matches[2] ?? '';
        if ($rest === '') {
            $rest = '/';
        }

        $newPath = '/api'.$rest;
        $query = $request->getQueryString();
        $newUri = $newPath.($query ? '?'.$query : '');

        $request->server->set('REQUEST_URI', $newUri);
        $request->server->set('PATH_INFO', $newPath);
        $request->initialize(
            $request->query->all(),
            $request->request->all(),
            $request->attributes->all(),
            $request->cookies->all(),
            $request->files->all(),
            $request->server->all(),
            $request->getContent()
        );

        app()->setLocale($matches[1]);

        return $next($request);
    }
}
