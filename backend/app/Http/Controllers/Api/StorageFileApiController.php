<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serve public media when nginx root is the SPA dist/ and /storage is not aliased.
 * Files live under storage/app/public (Laravel public disk / Spatie media).
 */
class StorageFileApiController extends Controller
{
    public function show(Request $request, string $path): BinaryFileResponse
    {
        $relative = str_replace('\\', '/', $path);
        $relative = ltrim($relative, '/');

        if ($relative === ''
            || str_contains($relative, '..')
            || str_starts_with($relative, '/')
        ) {
            abort(404);
        }

        $candidates = [
            storage_path('app/public/'.$relative),
            // Legacy mistaken path some uploads may have used
            storage_path($relative),
            public_path('storage/'.$relative),
        ];

        foreach ($candidates as $fullPath) {
            $realBase = realpath(dirname($fullPath));
            $realFile = is_file($fullPath) ? realpath($fullPath) : false;
            if (! $realFile || ! $realBase) {
                continue;
            }

            $allowedBases = array_filter([
                realpath(storage_path('app/public')),
                realpath(storage_path()),
                realpath(public_path('storage')),
            ]);

            $allowed = false;
            foreach ($allowedBases as $base) {
                if ($base && str_starts_with($realFile, $base.DIRECTORY_SEPARATOR)) {
                    $allowed = true;
                    break;
                }
            }

            if (! $allowed) {
                continue;
            }

            return response()->file($realFile, [
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        abort(404);
    }
}
