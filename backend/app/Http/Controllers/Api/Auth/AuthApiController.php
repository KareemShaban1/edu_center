<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterCenterRequest;
use App\Http\Support\ApiGuardMaps;
use App\Http\Support\AuthLoginHandler;
use App\Http\Support\AuthRegisterHandler;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AuthApiController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function guards(Request $request): JsonResponse
    {
        return response()->json([
            'guards' => ['users', 'teacher', 'parent', 'student', 'super_admin'],
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        return app(AuthLoginHandler::class)->login($request, ApiGuardMaps::GUARD_MAP, ApiGuardMaps::ROLE_MAP, ApiGuardMaps::TENANT_GUARDS);
    }

    public function registerParent(Request $request): JsonResponse
    {
        return app(AuthRegisterHandler::class)->registerParent($request);
    }

    public function registerStudent(Request $request): JsonResponse
    {
        return app(AuthRegisterHandler::class)->registerStudent($request);
    }

    public function registerCenter(RegisterCenterRequest $request): JsonResponse
    {
        return app(AuthRegisterHandler::class)->registerCenter($request);
    }

    public function memberships(Request $request): JsonResponse
    {
        return app(AuthLoginHandler::class)->listMemberships($request, ApiGuardMaps::GUARD_MAP);
    }

    public function switchCenter(Request $request): JsonResponse
    {
        return app(AuthLoginHandler::class)->switchCenter($request, ApiGuardMaps::GUARD_MAP, ApiGuardMaps::ROLE_MAP);
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->authService->logout($request);
    }

    public function user(Request $request): JsonResponse
    {
        return $this->authService->user($request);
    }
}
