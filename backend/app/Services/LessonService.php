<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\Lesson;
use App\Models\Platform\Center;
use App\Repositories\LessonRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class LessonService
{
    public function __construct(
        private readonly LessonRepository $lessonRepository,
        private readonly MediaService $mediaService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     */
    public function create(array $payload, array $uploadedFiles, Center $tenant): Lesson
    {
        $collection = (string) config('media.collections.lessons');

        $lesson = DB::connection('center')->transaction(function () use ($payload, $uploadedFiles, $tenant, $collection): Lesson {
            $lesson = new Lesson();
            $this->fillLesson($lesson, $payload);
            CenterIdAssigner::assign($lesson, (int) $tenant->id);
            $lesson->save();

            $this->mediaService->sync($lesson, $collection, $uploadedFiles);

            return $lesson;
        });

        return $this->lessonRepository->find((int) $lesson->id) ?? $lesson->load('media');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     * @param  list<int>  $removeMediaIds
     */
    public function update(
        Lesson $lesson,
        array $payload,
        array $uploadedFiles,
        array $removeMediaIds,
        Center $tenant,
    ): Lesson {
        $collection = (string) config('media.collections.lessons');

        DB::connection('center')->transaction(function () use (
            $lesson,
            $payload,
            $uploadedFiles,
            $removeMediaIds,
            $tenant,
            $collection,
        ): void {
            $this->fillLesson($lesson, $payload);
            CenterIdAssigner::assign($lesson, (int) $tenant->id, onlyIfMissing: true);
            $lesson->save();

            $this->mediaService->sync($lesson, $collection, $uploadedFiles, $removeMediaIds);
        });

        return $this->lessonRepository->find((int) $lesson->id) ?? $lesson->fresh(['media']);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateBasic(Lesson $lesson, array $payload, Center $tenant): Lesson
    {
        DB::connection('center')->transaction(function () use ($lesson, $payload, $tenant): void {
            $this->fillLesson($lesson, $payload);
            CenterIdAssigner::assign($lesson, (int) $tenant->id, onlyIfMissing: true);
            $lesson->save();
        });

        return $lesson->fresh() ?? $lesson;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillLesson(Lesson $lesson, array $payload): void
    {
        $lesson->name = (string) $payload['name'];
        $lesson->unit_id = (int) $payload['unit_id'];
        $lesson->notes = $payload['notes'] ?? '';
    }
}
