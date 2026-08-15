<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SearchStudentByCodeRequest;
use App\Http\Requests\Admin\StoreStudentRequest;
use App\Http\Requests\Admin\UpdateStudentRequest;
use App\Http\Resources\ParentSearchResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\StudentSearchResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\AdminStudentDetailsService;
use App\Services\AdminStudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminStudentsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly AdminStudentDetailsService $adminStudentDetailsService,
        private readonly AdminStudentService $adminStudentService,
    ) {}

    public function show(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenantDb' => $tenantDb] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $payload = $this->adminStudentDetailsService->build($tenantDb, $id);
        if (! $payload) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        return response()->json($payload);
    }

    public function searchByCode(SearchStudentByCodeRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->adminStudentService->searchByCode(
            (string) $request->validated('code'),
            $tenant,
        );
        if ($result === null) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        return response()->json([
            'student' => StudentSearchResource::make($result['student']),
            'parent' => $result['parent'] !== null
                ? ParentSearchResource::make($result['parent'])
                : null,
        ]);
    }

    public function postAssignCenter(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->adminStudentService->assignToCenter($tenant, $id);
        if ($result === null) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        return response()->json($result);
    }

    public function postUnassignCenter(Request $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->adminStudentService->unassignFromCenter($tenant, $id);
        if ($result === null) {
            return response()->json(['message' => 'Student not found'], 404);
        }
        if (isset($result['status'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json($result);
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $student = $this->adminStudentService->create($request->validated(), $tenant);

        return response()->json([
            'student' => StudentResource::make($student),
        ], 201);
    }

    public function update(UpdateStudentRequest $request, int $id): JsonResponse
    {
        ['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $student = $this->adminStudentService->update($id, $request->validated(), $tenant);
        if ($student === null) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        return response()->json([
            'student' => StudentResource::make($student),
        ]);
    }
}
