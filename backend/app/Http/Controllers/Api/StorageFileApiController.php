<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serve public media when nginx root is the SPA dist/ and /storage is not aliased.
 */
class StorageFileApiController extends Controller
{
    public function show(int $mediaId, string $fileName): BinaryFileResponse
    {
        $fileName = rawurldecode($fileName);
        $fileName = basename(str_replace('\\', '/', $fileName));

        if ($mediaId < 1 || $fileName === '' || $fileName === '.' || $fileName === '..') {
            abort(404);
        }

        $relative = $mediaId.'/'.$fileName;

        $candidates = [
            storage_path('app/public/'.$relative),
            public_path('storage/'.$relative),
            storage_path($relative),
        ];

        foreach ($candidates as $fullPath) {
            if (! is_file($fullPath) || ! is_readable($fullPath)) {
                continue;
            }

            $realFile = realpath($fullPath);
            if ($realFile === false) {
                continue;
            }

            if (! $this->isAllowedPath($realFile)) {
                continue;
            }

            return Response::file($realFile, [
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        // Spatie may store under media id with a different on-disk name; try by media id folder.
        foreach ([storage_path('app/public/'.$mediaId), public_path('storage/'.$mediaId)] as $dir) {
            if (! is_dir($dir)) {
                continue;
            }
            $match = $dir.DIRECTORY_SEPARATOR.$fileName;
            if (is_file($match) && is_readable($match)) {
                $realFile = realpath($match);
                if ($realFile && $this->isAllowedPath($realFile)) {
                    return Response::file($realFile, [
                        'Cache-Control' => 'public, max-age=86400',
                    ]);
                }
            }
            // If exact name missing, serve the only file in that media folder.
            $files = array_values(array_filter(scandir($dir) ?: [], fn ($f) => $f !== '.' && $f !== '..'));
            if (count($files) === 1) {
                $only = $dir.DIRECTORY_SEPARATOR.$files[0];
                if (is_file($only) && ($realFile = realpath($only)) && $this->isAllowedPath($realFile)) {
                    return Response::file($realFile, [
                        'Cache-Control' => 'public, max-age=86400',
                    ]);
                }
            }
        }

        abort(404);
    }

    private function isAllowedPath(string $realFile): bool
    {
        $allowedBases = array_values(array_filter([
            realpath(storage_path('app/public')),
            realpath(public_path('storage')),
            realpath(storage_path()),
        ]));

        foreach ($allowedBases as $base) {
            if ($base && str_starts_with($realFile, rtrim($base, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR)) {
                return true;
            }
        }

        return false;
    }
}
