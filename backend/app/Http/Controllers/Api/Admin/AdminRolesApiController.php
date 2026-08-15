<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminRoleRequest;
use App\Http\Requests\Admin\UpdateAdminRoleRequest;
use App\Http\Resources\AdminRoleResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\AdminRoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminRolesApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly AdminRoleService $roleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->roleService->list();

        return response()->json([
            'roles' => AdminRoleResource::collection($result['roles']),
            'permissions' => $result['permissions'],
        ]);
    }

    public function store(StoreAdminRoleRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->roleService->store($request->validated());
        if (isset($result['status'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['id' => $result['id']], 201);
    }

    public function update(UpdateAdminRoleRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->roleService->update($id, $request->validated());
        if (isset($result['status'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['message' => $result['message']]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->roleService->destroy($id);
        if (isset($result['status'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['message' => $result['message']]);
    }
}
