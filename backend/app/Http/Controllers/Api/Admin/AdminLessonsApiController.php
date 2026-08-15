<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLessonRequest;
use App\Http\Requests\Admin\UpdateLessonBasicRequest;
use App\Http\Requests\Admin\UpdateLessonRequest;
use App\Http\Resources\LessonResource;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Lesson;
use App\Services\LessonService;
use Illuminate\Http\JsonResponse;

final class AdminLessonsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly LessonService $lessonService,
    ) {}

    public function store(StoreLessonRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $uploadedFiles = AdminUploadHelper::validatedFiles(
            $request,
            (string) config('media.upload.files_key'),
            (int) config('media.upload.max_kb'),
        );

        $lesson = $this->lessonService->create(
            $request->validated(),
            $uploadedFiles,
            $tenant,
        );

        return response()->json([
            'lesson' => LessonResource::make($lesson),
        ], 201);
    }

    public function updateWithMedia(UpdateLessonRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $lesson = Lesson::query()->find($id);
        if ($lesson === null) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        $uploadedFiles = AdminUploadHelper::validatedFiles(
            $request,
            (string) config('media.upload.files_key'),
            (int) config('media.upload.max_kb'),
        );

        $payload = $request->validated();

        $lesson = $this->lessonService->update(
            $lesson,
            $payload,
            $uploadedFiles,
            $payload['remove_media_ids'] ?? [],
            $tenant,
        );

        return response()->json([
            'lesson' => LessonResource::make($lesson),
        ]);
    }

    public function update(UpdateLessonBasicRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $lesson = Lesson::query()->find($id);
        if ($lesson === null) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        $payload = $request->validated();

        $this->lessonService->updateBasic($lesson, $payload, $tenant);

        return response()->json([
            'lesson' => [
                'id' => $id,
                'name' => $payload['name'],
                'unit_id' => $payload['unit_id'],
                'notes' => $payload['notes'] ?? '',
            ],
        ]);
    }
}
