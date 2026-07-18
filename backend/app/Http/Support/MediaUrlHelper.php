<?php

declare(strict_types=1);

namespace App\Http\Support;

use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class MediaUrlHelper
{
    /**
     * Return a same-origin API path so files work when nginx root is SPA dist/
     * and only /api is proxied to Laravel (typical Contabo/aaPanel setup).
     */
    public static function publicPath(?Media $media): ?string
    {
        if ($media === null) {
            return null;
        }

        $relative = self::relativePath($media);
        if ($relative === '') {
            return null;
        }

        return '/api/storage/'.$relative;
    }

    private static function relativePath(Media $media): string
    {
        $url = (string) $media->getUrl();

        if (preg_match('~/storage/([^\s?]+)~', $url, $matches)) {
            return ltrim($matches[1], '/');
        }

        if (preg_match('~^https?://storage/([^\s?]+)~i', $url, $matches)) {
            return ltrim($matches[1], '/');
        }

        if (method_exists($media, 'getPathRelativeToRoot')) {
            $relative = ltrim((string) $media->getPathRelativeToRoot(), '/');
            if ($relative !== '') {
                return $relative;
            }
        }

        return trim((string) $media->id.'/'.(string) $media->file_name, '/');
    }
}
