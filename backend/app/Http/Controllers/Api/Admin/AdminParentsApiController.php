<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreParentRequest;
use App\Http\Requests\Admin\UpdateParentRequest;
use App\Http\Resources\ParentResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Parents;
use App\Services\ParentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminParentsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly ParentService $parentService,
    ) {}

    public function store(StoreParentRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $parent = $this->parentService->create($request->validated(), $tenant);

        return response()->json([
            'parent' => ParentResource::make($parent),
        ], 201);
    }

    public function update(UpdateParentRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $parent = Parents::query()->find($id);
        if ($parent === null) {
            return response()->json(['message' => 'Parent not found'], 404);
        }

        $parent = $this->parentService->update($parent, $request->validated());

        return response()->json([
            'parent' => ParentResource::make($parent),
        ]);
    }
}
