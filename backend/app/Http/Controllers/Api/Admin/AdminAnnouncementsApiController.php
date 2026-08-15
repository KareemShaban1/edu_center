<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateAnnouncementRequest;
use App\Http\Resources\AnnouncementResource;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Announcement;
use App\Services\Api\Admin\AnnouncementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminAnnouncementsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly AnnouncementService $announcementService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $announcements = $this->announcementService->list();

        return response()->json([
            'announcements' => AnnouncementResource::collection($announcements)->resolve($request),
        ]);
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
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

        $announcement = $this->announcementService->create(
            $request->validated(),
            $uploadedFiles,
            $tenant,
        );

        return response()->json([
            'announcement' => AnnouncementResource::make($announcement)->resolve($request),
        ]);
    }

    public function updateWithMedia(UpdateAnnouncementRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $announcement = Announcement::query()->find($id);
        if ($announcement === null) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        $uploadedFiles = AdminUploadHelper::validatedFiles(
            $request,
            (string) config('media.upload.files_key'),
            (int) config('media.upload.max_kb'),
        );

        $payload = $request->validated();

        $announcement = $this->announcementService->update(
            $announcement,
            $payload,
            $uploadedFiles,
            $payload['remove_media_ids'] ?? [],
            $tenant,
        );

        return response()->json([
            'announcement' => AnnouncementResource::make($announcement)->resolve($request),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $announcement = Announcement::query()->find($id);
        if ($announcement === null) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        $this->announcementService->delete($announcement);

        return response()->json(['message' => 'Announcement deleted']);
    }
}