<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\Library;
use App\Models\Platform\Center;
use App\Repositories\LibraryRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class LibraryService
{
    public function __construct(
        private readonly LibraryRepository $libraryRepository,
        private readonly MediaService $mediaService,
    ) {}

    /**
     * @return Collection<int, Library>
     */
    public function list(): Collection
    {
        return $this->libraryRepository->allWithRelations();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     */
    public function create(array $payload, array $uploadedFiles, Center $tenant): Library
    {
        $collection = (string) config('media.collections.library');

        $library = DB::connection('center')->transaction(function () use ($payload, $uploadedFiles, $tenant, $collection): Library {
            $library = new Library();
            $this->fillLibrary($library, $payload);
            CenterIdAssigner::assign($library, (int) $tenant->id);
            $library->save();

            $this->mediaService->sync($library, $collection, $uploadedFiles);

            return $library;
        });

        return $this->libraryRepository->find((int) $library->id) ?? $library->load([
            'grade:id,grade_name',
            'class:id,class_name',
            'section:id,section_name',
            'media',
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     * @param  list<int>  $removeMediaIds
     */
    public function update(
        Library $library,
        array $payload,
        array $uploadedFiles,
        array $removeMediaIds,
        Center $tenant,
    ): Library {
        $collection = (string) config('media.collections.library');

        DB::connection('center')->transaction(function () use (
            $library,
            $payload,
            $uploadedFiles,
            $removeMediaIds,
            $tenant,
            $collection,
        ): void {
            $this->fillLibrary($library, $payload);
            CenterIdAssigner::assign($library, (int) $tenant->id, onlyIfMissing: true);
            $library->save();

            $this->mediaService->sync($library, $collection, $uploadedFiles, $removeMediaIds);
        });

        return $this->libraryRepository->find((int) $library->id) ?? $library->fresh([
            'grade:id,grade_name',
            'class:id,class_name',
            'section:id,section_name',
            'media',
        ]);
    }

    public function delete(Library $library): void
    {
        $collection = (string) config('media.collections.library');

        DB::connection('center')->transaction(function () use ($library, $collection): void {
            $this->mediaService->clearCollection($library, $collection);
            $library->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillLibrary(Library $library, array $payload): void
    {
        $library->title = (string) $payload['title'];
        $library->grade_id = (int) $payload['grade_id'];
        $library->class_id = (int) $payload['class_id'];
        $library->section_id = (int) $payload['section_id'];
        $library->type = (string) $payload['type'];
        $library->notes = $payload['notes'] ?? null;
    }
}
