<?php

declare(strict_types=1);

namespace App\Http\Support;

use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class MediaUrlHelper
{
    /**
     * Return a same-origin path (/storage/...) for SPA + nginx alias.
     * Avoids broken absolute URLs when APP_URL / disk URL is misconfigured
     * (e.g. https://storage/1/file.png).
     */
    public static function publicPath(?Media $media): ?string
    {
        if ($media === null) {
            return null;
        }

        $url = (string) $media->getUrl();

        if (preg_match('#(/storage/[^\s?#]+)#', $url, $matches)) {
            return $matches[1];
        }

        // Host mistakenly became "storage" (https://storage/1/file.png)
        if (preg_match('#^https?://storage(/[^\s?#]+)#i', $url, $matches)) {
            return '/storage'.$matches[1];
        }

        $relative = '';
        if (method_exists($media, 'getPathRelativeToRoot')) {
            $relative = ltrim((string) $media->getPathRelativeToRoot(), '/');
        }
        if ($relative === '') {
            $relative = trim((string) $media->id.'/'.(string) $media->file_name, '/');
        }

        return '/storage/'.$relative;
    }
}
