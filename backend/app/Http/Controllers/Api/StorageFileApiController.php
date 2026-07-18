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
        $fileName = basename(str_replace(['\\', "\0"], ['/', ''], $fileName));

        if ($mediaId < 1 || $fileName === '' || $fileName === '.' || $fileName === '..') {
            abort(404, 'Invalid media path');
        }

        $relative = $mediaId.'/'.$fileName;
        $fullPath = $this->findFile($relative, $mediaId, $fileName);

        if ($fullPath === null) {
            abort(404, 'Media file not found');
        }

        return Response::file($fullPath, [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    private function findFile(string $relative, int $mediaId, string $fileName): ?string
    {
        $candidates = [
            public_path('storage/'.$relative),
            storage_path('app/public/'.$relative),
            storage_path($relative),
        ];

        foreach ($candidates as $fullPath) {
            if ($this->isSafeReadableFile($fullPath)) {
                return $fullPath;
            }
        }

        // Folder exists but filename differs — serve sole file in media id folder.
        foreach ([
            public_path('storage/'.$mediaId),
            storage_path('app/public/'.$mediaId),
        ] as $dir) {
            if (! is_dir($dir)) {
                continue;
            }

            $exact = $dir.DIRECTORY_SEPARATOR.$fileName;
            if ($this->isSafeReadableFile($exact)) {
                return $exact;
            }

            $files = array_values(array_filter(
                scandir($dir) ?: [],
                static fn ($f) => $f !== '.' && $f !== '..' && is_file($dir.DIRECTORY_SEPARATOR.$f)
            ));

            if (count($files) === 1) {
                $only = $dir.DIRECTORY_SEPARATOR.$files[0];
                if ($this->isSafeReadableFile($only)) {
                    return $only;
                }
            }
        }

        return null;
    }

    private function isSafeReadableFile(string $fullPath): bool
    {
        if (! is_file($fullPath) || ! is_readable($fullPath)) {
            return false;
        }

        $normalized = str_replace('\\', '/', $fullPath);
        if (str_contains($normalized, '..')) {
            return false;
        }

        $allowedPrefixes = [
            str_replace('\\', '/', public_path('storage')).'/',
            str_replace('\\', '/', storage_path('app/public')).'/',
            str_replace('\\', '/', storage_path()).'/',
        ];

        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($normalized, $prefix)) {
                return true;
            }
        }

        // Symlink resolution (public/storage -> storage/app/public)
        $realFile = realpath($fullPath);
        if ($realFile === false) {
            return false;
        }

        $realFile = str_replace('\\', '/', $realFile);
        foreach ([
            realpath(public_path('storage')),
            realpath(storage_path('app/public')),
            realpath(storage_path()),
        ] as $base) {
            if (! $base) {
                continue;
            }
            $base = rtrim(str_replace('\\', '/', $base), '/').'/';
            if (str_starts_with($realFile, $base)) {
                return true;
            }
        }

        return false;
    }
}
