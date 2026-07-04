<?php

declare(strict_types=1);

namespace App\Http\Support;

use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class MediaUrlHelper
{
    /**
     * Return a same-origin path (/storage/...) for SPA + dev proxy instead of absolute APP_URL.
     */
    public static function publicPath(?Media $media): ?string
    {
        if ($media === null) {
            return null;
        }

        $path = parse_url($media->getUrl(), PHP_URL_PATH);

        return is_string($path) && $path !== '' ? $path : $media->getUrl();
    }
}
