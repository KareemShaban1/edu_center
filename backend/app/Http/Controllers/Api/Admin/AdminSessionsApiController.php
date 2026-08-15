<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateSessionsRequest;
use App\Http\Requests\Admin\StoreSessionRequest;
use App\Http\Requests\Admin\UpdateSessionRequest;
use App\Http\Resources\AdminSessionResource;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class AdminSessionsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly SessionService $sessionService,
    ) {}

    public function generate(GenerateSessionsRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->sessionService->generate($request->validated());

        return response()->json([
            'message' => $result['message'],
            'generation' => $result['generation'],
        ], $result['status']);
    }

    public function index(Request $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $payload = $this->sessionService->list();

        return response()->json([
            'sessions' => AdminSessionResource::collection($payload['sessions']),
        ]);
    }

    public function store(StoreSessionRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $createdBy = (string) (optional(Auth::guard('web')->user())->email ?? 'Admin');
        $result = $this->sessionService->create($request->validated(), $createdBy);

        if (isset($result['message'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['ok' => true]);
    }

    public function update(UpdateSessionRequest $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->sessionService->update($id, $request->validated());

        if (isset($result['message'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $result = $this->sessionService->delete($id);

        if (isset($result['message'])) {
            return response()->json(['message' => $result['message']], $result['status']);
        }

        return response()->json(['ok' => true]);
    }
}
