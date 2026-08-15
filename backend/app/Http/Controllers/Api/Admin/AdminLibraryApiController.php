<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLibraryRequest;
use App\Http\Requests\Admin\UpdateLibraryRequest;
use App\Http\Resources\LibraryResource;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Library;
use App\Services\LibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminLibraryApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly LibraryService $libraryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $libraryItems = $this->libraryService->list();

        return response()->json([
            'library' => LibraryResource::collection($libraryItems),
        ]);
    }

    public function store(StoreLibraryRequest $request): JsonResponse
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

        $library = $this->libraryService->create(
            $request->validated(),
            $uploadedFiles,
            $tenant,
        );

        return response()->json([
            'library' => LibraryResource::make($library),
        ], 201);
    }

    public function updateWithMedia(UpdateLibraryRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $library = Library::query()->find($id);
        if ($library === null) {
            return response()->json(['message' => 'Library item not found'], 404);
        }

        $uploadedFiles = AdminUploadHelper::validatedFiles(
            $request,
            (string) config('media.upload.files_key'),
            (int) config('media.upload.max_kb'),
        );

        $payload = $request->validated();

        $library = $this->libraryService->update(
            $library,
            $payload,
            $uploadedFiles,
            $payload['remove_media_ids'] ?? [],
            $tenant,
        );

        return response()->json([
            'library' => LibraryResource::make($library),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $library = Library::query()->find($id);
        if ($library === null) {
            return response()->json(['message' => 'Library item not found'], 404);
        }

        $this->libraryService->delete($library);

        return response()->json(['message' => 'Library item deleted']);
    }
}
