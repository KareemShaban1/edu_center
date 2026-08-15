<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/** @mixin Media */
final class MediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name ?: $this->file_name,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'size' => (int) $this->size,
            'type' => $this->mime_type ?: 'application/octet-stream',
            'url' => $this->getUrl(),
        ];
    }
}
