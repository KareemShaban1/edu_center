<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTeacherRequest;
use App\Http\Requests\Admin\UpdateTeacherRequest;
use App\Http\Resources\TeacherResource;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Teacher;
use App\Services\TeacherService;
use Illuminate\Http\JsonResponse;

final class AdminTeachersApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly TeacherService $teacherService,
    ) {}

    public function store(StoreTeacherRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $uploadedFiles = AdminUploadHelper::validatedFiles(
            $request,
            (string) config('media.upload.files_key'),
            (int) config('media.upload.max_kb'),
        );

        $teacher = $this->teacherService->create($request->validated(), $uploadedFiles);

        return response()->json([
            'teacher' => TeacherResource::make($teacher),
        ], 201);
    }

    public function update(UpdateTeacherRequest $request, int $id): JsonResponse
    {
        return $this->persistUpdate($request, $id);
    }

    public function updateWithMedia(UpdateTeacherRequest $request, int $id): JsonResponse
    {
        return $this->persistUpdate($request, $id);
    }

    private function persistUpdate(UpdateTeacherRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $teacher = Teacher::query()->find($id);
        if ($teacher === null) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }

        $uploadedFiles = AdminUploadHelper::validatedFiles(
            $request,
            (string) config('media.upload.files_key'),
            (int) config('media.upload.max_kb'),
        );

        $payload = $request->validated();

        $teacher = $this->teacherService->update(
            $teacher,
            $payload,
            $uploadedFiles,
            $payload['remove_media_ids'] ?? [],
        );

        return response()->json([
            'teacher' => TeacherResource::make($teacher),
        ]);
    }
}
