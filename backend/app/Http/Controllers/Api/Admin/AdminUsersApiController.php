<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Http\Resources\AdminUserResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class AdminUsersApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly AdminUserService $userService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        return response()->json([
            'users' => AdminUserResource::collection($this->userService->list()),
        ]);
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->userService->store($request->validated());
        if (isset($result['status'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['id' => $result['id']], 201);
    }

    public function update(UpdateAdminUserRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->userService->update($id, $request->validated());
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

        $currentUserId = (int) Auth::guard('web')->id();
        $result = $this->userService->destroy($id, $currentUserId);
        if (isset($result['status'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['message' => $result['message']]);
    }
}
