<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class MediaService
{
    /**
     * @param  list<UploadedFile>  $uploadedFiles
     * @param  list<int>  $removeMediaIds
     */
    public function sync(
        HasMedia $model,
        string $collection,
        array $uploadedFiles = [],
        array $removeMediaIds = [],
    ): void {
        $removeIds = collect($removeMediaIds)
            ->map(static fn ($id) => (int) $id)
            ->filter()
            ->values();

        if ($removeIds->isEmpty() && $uploadedFiles === []) {
            return;
        }

        if ($removeIds->isNotEmpty()) {
            Media::query()
                ->whereIn('id', $removeIds)
                ->where('model_type', $model::class)
                ->where('model_id', $model->getKey())
                ->get()
                ->each(static fn (Media $media) => $media->delete());
        }

        foreach ($uploadedFiles as $file) {
            $model->addMedia($file)->toMediaCollection($collection);
        }
    }

    public function clearCollection(HasMedia $model, string $collection): void
    {
        $model->clearMediaCollection($collection);
    }
}
