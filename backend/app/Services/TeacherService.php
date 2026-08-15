<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

final class TeacherService
{
    public function __construct(
        private readonly MediaService $mediaService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     */
    public function create(array $payload, array $uploadedFiles = []): Teacher
    {
        $classIds = $this->normalizeClassIds($payload['class_ids'] ?? []);
        $collection = (string) config('media.collections.teachers');

        $teacher = DB::connection('center')->transaction(function () use ($payload, $classIds, $uploadedFiles, $collection): Teacher {
            $teacher = new Teacher();
            $this->fillTeacher($teacher, $payload, includePassword: true);
            $teacher->joining_date = now()->toDateString();
            $teacher->save();

            $this->syncTeacherSections((int) $teacher->id, $classIds);
            $this->mediaService->sync($teacher, $collection, $uploadedFiles);

            return $teacher->fresh() ?? $teacher;
        });

        return $this->decorateTeacherResponse($teacher, $classIds, $payload['status'] ?? 'active');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     * @param  list<int>  $removeMediaIds
     */
    public function update(Teacher $teacher, array $payload, array $uploadedFiles = [], array $removeMediaIds = []): Teacher
    {
        $classIds = $this->normalizeClassIds($payload['class_ids'] ?? []);
        $collection = (string) config('media.collections.teachers');

        DB::connection('center')->transaction(function () use ($teacher, $payload, $classIds, $uploadedFiles, $removeMediaIds, $collection): void {
            $this->fillTeacher($teacher, $payload, includePassword: ! empty($payload['password']));
            $teacher->save();

            $this->syncTeacherSections((int) $teacher->id, $classIds);
            $this->mediaService->sync($teacher, $collection, $uploadedFiles, $removeMediaIds);
        });

        $teacher = $teacher->fresh() ?? $teacher;

        return $this->decorateTeacherResponse($teacher, $classIds, $payload['status'] ?? 'active');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillTeacher(Teacher $teacher, array $payload, bool $includePassword): void
    {
        $teacher->name = (string) $payload['name'];
        $teacher->email = (string) $payload['email'];
        $teacher->subject = $payload['specialization'] ?? null;
        $teacher->phone = (string) $payload['phone'];
        $teacher->gender = (string) $payload['gender'];

        if (Schema::connection('center')->hasColumn('teachers', 'is_active')) {
            $teacher->setAttribute('is_active', ($payload['status'] ?? 'active') === 'active');
        }

        if ($includePassword && ! empty($payload['password'])) {
            $teacher->password = Hash::make((string) $payload['password']);
        }
    }

    /**
     * @param  list<int>  $classIds
     */
    private function syncTeacherSections(int $teacherId, array $classIds): void
    {
        if (! Schema::connection('center')->hasTable('teacher_section')) {
            return;
        }

        DB::connection('center')->table('teacher_section')->where('teacher_id', $teacherId)->delete();

        if ($classIds === [] || ! Schema::connection('center')->hasTable('sections')) {
            return;
        }

        $sectionIds = DB::connection('center')->table('sections')
            ->whereIn('class_id', $classIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($sectionIds === []) {
            return;
        }

        DB::connection('center')->table('teacher_section')->insert(
            collect($sectionIds)->map(fn (int $sectionId) => [
                'teacher_id' => $teacherId,
                'section_id' => $sectionId,
            ])->all()
        );
    }

    /**
     * @param  array<int|string, mixed>|null  $classIds
     * @return list<int>
     */
    private function normalizeClassIds(?array $classIds): array
    {
        return collect($classIds ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $classIds
     */
    private function decorateTeacherResponse(Teacher $teacher, array $classIds, string $fallbackStatus): Teacher
    {
        $teacher->setAttribute('class_ids', $classIds);
        $teacher->setAttribute('api_status', $this->resolveStatus($teacher, $fallbackStatus));

        return $teacher;
    }

    private function resolveStatus(Teacher $teacher, string $fallbackStatus): string
    {
        if (Schema::connection('center')->hasColumn('teachers', 'is_active')) {
            return $teacher->is_active ? 'active' : 'inactive';
        }

        return $fallbackStatus;
    }
}
