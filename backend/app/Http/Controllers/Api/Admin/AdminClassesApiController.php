<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClassRequest;
use App\Http\Requests\Admin\UpdateClassRequest;
use App\Http\Resources\ClassResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Classes;
use App\Models\Section;
use App\Services\ClassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminClassesApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly ClassService $classService,
    ) {}

    public function store(StoreClassRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $class = $this->classService->create($request->validated(), $tenant);

        return response()->json([
            'class' => ClassResource::make($class),
        ], 201);
    }

    public function update(UpdateClassRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $class = Classes::query()->find($id);
        if ($class === null) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        $class = $this->classService->update($class, $request->validated(), $tenant);

        return response()->json([
            'class' => ClassResource::make($class),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $class = Classes::query()->find($id);
        if ($class === null) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        if (Section::query()->where('class_id', $id)->exists()) {
            return response()->json(['message' => 'Cannot delete a class that has sections'], 409);
        }

        $this->classService->delete($class);

        return response()->json(['message' => 'Class deleted']);
    }
}
