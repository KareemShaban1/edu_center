<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUnitRequest;
use App\Http\Requests\Admin\UpdateUnitBasicRequest;
use App\Http\Requests\Admin\UpdateUnitRequest;
use App\Http\Resources\UnitResource;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Unit;
use App\Services\UnitService;
use Illuminate\Http\JsonResponse;

final class AdminUnitsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly UnitService $unitService,
    ) {}

    public function store(StoreUnitRequest $request): JsonResponse
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

        $unit = $this->unitService->create(
            $request->validated(),
            $uploadedFiles,
            $tenant,
        );

        return response()->json([
            'unit' => UnitResource::make($unit),
        ], 201);
    }

    public function updateWithMedia(UpdateUnitRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $unit = Unit::query()->find($id);
        if ($unit === null) {
            return response()->json(['message' => 'Unit not found'], 404);
        }

        $uploadedFiles = AdminUploadHelper::validatedFiles(
            $request,
            (string) config('media.upload.files_key'),
            (int) config('media.upload.max_kb'),
        );

        $payload = $request->validated();

        $unit = $this->unitService->update(
            $unit,
            $payload,
            $uploadedFiles,
            $payload['remove_media_ids'] ?? [],
            $tenant,
        );

        return response()->json([
            'unit' => UnitResource::make($unit),
        ]);
    }

    public function update(UpdateUnitBasicRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $unit = Unit::query()->find($id);
        if ($unit === null) {
            return response()->json(['message' => 'Unit not found'], 404);
        }

        $payload = $request->validated();

        $this->unitService->updateBasic($unit, $payload, $tenant);

        return response()->json([
            'unit' => [
                'id' => $id,
                'name' => $payload['name'],
                'class_id' => $payload['class_id'],
                'notes' => $payload['notes'] ?? '',
            ],
        ]);
    }
}
