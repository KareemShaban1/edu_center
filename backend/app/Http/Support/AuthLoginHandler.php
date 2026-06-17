<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Centers\CenterContextManager;
use App\Centers\CenterMembershipService;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthLoginHandler
{
    public function __construct(
        protected CenterContextManager $centerContext,
        protected CenterMembershipService $memberships,
    ) {
    }

    /** @param array<string, string> $guardMap @param array<string, string> $roleMap @param array<int, string> $centerGuards */
    public function login(Request $request, array $guardMap, array $roleMap, array $centerGuards): JsonResponse
    {
        $payload = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'guard' => ['nullable', 'string'],
            'portal' => ['nullable', 'boolean'],
            'tenant_slug' => ['nullable', 'string'],
            'tenantSlug' => ['nullable', 'string'],
            'center_slug' => ['nullable', 'string'],
            'centerSlug' => ['nullable', 'string'],
            'membership_id' => ['nullable', 'integer'],
        ]);

        $guard = $payload['guard'] ?? 'users';
        $authGuard = $guardMap[$guard] ?? 'web';
        $centerSlug = $payload['center_slug']
            ?? $payload['centerSlug']
            ?? $payload['tenant_slug']
            ?? $payload['tenantSlug']
            ?? $request->header('X-Center-Slug')
            ?? $request->header('X-Tenant-Slug');

        if ($this->memberships->roleSupportsMultipleCenters($authGuard)) {
            if (! empty($payload['portal'])) {
                return $this->loginPortal($request, $authGuard, $roleMap, $payload);
            }

            return $this->loginWithMembershipIdentity($request, $authGuard, $roleMap, $payload, $centerSlug);
        }

        return $this->loginCenterScoped($request, $authGuard, $roleMap, $centerGuards, $payload, $centerSlug);
    }

    public function switchCenter(Request $request, array $guardMap, array $roleMap): JsonResponse
    {
        $payload = $request->validate([
            'membership_id' => ['required', 'integer'],
            'guard' => ['nullable', 'string'],
        ]);

        $guard = $payload['guard'] ?? $request->session()->get('api_auth_guard', 'parent');
        $authGuard = $guardMap[$guard] ?? $guard;
        $email = $request->session()->get('api_profile_email');

        if (! $email) {
            return response()->json(['message' => 'Profile session not found. Please login again.'], 401);
        }

        $userType = CenterMembership::userTypeForGuard($authGuard);
        $membership = $this->memberships->findMembershipById($email, $userType, (int) $payload['membership_id']);
        if (! $membership) {
            return response()->json(['message' => 'Membership not found.'], 404);
        }

        $center = Center::query()->find($membership->center_id);

        return $this->establishSession(
            $request,
            $authGuard,
            $roleMap,
            $center,
            (int) $membership->user_id,
            $membership->center_id,
            $center?->slug,
            $email,
            (string) $membership->user_type,
        );
    }

    public function listMemberships(Request $request, array $guardMap): JsonResponse
    {
        $guard = $request->query('guard', $request->session()->get('api_auth_guard', 'parent'));
        $authGuard = $guardMap[$guard] ?? $guard;
        $email = $request->session()->get('api_profile_email');

        if (! $email) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userType = CenterMembership::userTypeForGuard($authGuard);

        return response()->json([
            'memberships' => $this->memberships->listMemberships($email, $userType)->values(),
        ]);
    }

    public function loginPortal(Request $request, string $authGuard, array $roleMap, array $payload): JsonResponse
    {
        $role = $authGuard === 'student' ? CenterMembership::ROLE_STUDENT : CenterMembership::ROLE_PARENT;
        $identity = $this->memberships->authenticate($payload['email'], $payload['password'], $role);

        if (! $identity) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $memberships = $this->memberships->listMemberships($identity['email'], $identity['user_type']);
        if ($memberships->isEmpty()) {
            return response()->json(['message' => 'No assigned center membership found for this account.'], 403);
        }

        $request->session()->regenerate();
        $request->session()->put('api_auth_guard', $authGuard);
        $request->session()->put('api_profile_email', $identity['email']);
        $request->session()->put('api_profile_user_type', $identity['user_type']);
        $request->session()->put('api_portal_mode', true);
        $request->session()->forget([
            'api_center_id',
            'api_center_slug',
            'api_tenant_id',
            'api_tenant_slug',
            'api_auth_user_id',
            'api_global_user_id',
        ]);

        foreach (['parent', 'student', 'web', 'teacher'] as $guardName) {
            if (Auth::guard($guardName)->check()) {
                Auth::guard($guardName)->logout();
            }
        }

        $portal = app(MultiCenterPortalService::class);
        $portalData = $authGuard === 'student'
            ? $portal->studentPortal($identity['email'], $identity['user_type'])
            : $portal->parentPortal($identity['email'], $identity['user_type']);

        $apiToken = ApiBearerAuth::issuePortal($authGuard, $identity['email'], $identity['user_type']);

        return response()->json([
            'token' => $apiToken,
            'portal' => true,
            'portal_data' => $portalData,
            'memberships' => $memberships->values(),
            'user' => [
                'id' => 0,
                'name' => $identity['name'],
                'email' => $identity['email'],
                'role' => $roleMap[$authGuard] ?? $role,
                'locale' => app()->getLocale(),
                'created_at' => now()->toDateString(),
                'portal_mode' => true,
                'center_count' => count($portalData['centers'] ?? []),
            ],
        ]);
    }

    protected function loginWithMembershipIdentity(
        Request $request,
        string $authGuard,
        array $roleMap,
        array $payload,
        ?string $centerSlug
    ): JsonResponse {
        $role = $authGuard === 'student' ? CenterMembership::ROLE_STUDENT : CenterMembership::ROLE_PARENT;
        $identity = $this->memberships->authenticate($payload['email'], $payload['password'], $role);

        if (! $identity) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (! empty($payload['membership_id'])) {
            $membership = $this->memberships->findMembershipById(
                $identity['email'],
                $identity['user_type'],
                (int) $payload['membership_id']
            );
        } else {
            $membership = $this->memberships->resolveMembership($identity['email'], $identity['user_type'], $centerSlug, null);
        }

        if (! $membership) {
            $available = $this->memberships->listMemberships($identity['email'], $identity['user_type']);
            if ($available->isEmpty()) {
                return response()->json(['message' => 'No assigned center membership found for this account.'], 403);
            }

            if ($available->count() > 1) {
                return response()->json([
                    'requires_tenant_selection' => true,
                    'requires_center_selection' => true,
                    'memberships' => $available->values(),
                    'user' => [
                        'name' => $identity['name'],
                        'email' => $identity['email'],
                        'role' => $roleMap[$authGuard] ?? $role,
                    ],
                ], 409);
            }

            $membership = CenterMembership::query()->find($available->first()['membership_id']);
        }

        $center = Center::query()->find($membership->center_id);

        return $this->establishSession(
            $request,
            $authGuard,
            $roleMap,
            $center,
            (int) $membership->user_id,
            $membership->center_id,
            $center?->slug,
            $identity['email'],
            (string) $membership->user_type,
        );
    }

    protected function loginCenterScoped(
        Request $request,
        string $authGuard,
        array $roleMap,
        array $centerGuards,
        array $payload,
        ?string $centerSlug
    ): JsonResponse {
        $center = null;

        if (in_array($authGuard, $centerGuards, true)) {
            $center = $this->centerContext->resolveBySlug($centerSlug);
            if (! $center) {
                return response()->json(['message' => 'Invalid center slug. Please enter a valid center code.'], 422);
            }

            $this->centerContext->initialize($center);

            if (! DB::connection('center')->getDatabaseName()) {
                return response()->json(['message' => 'Center database was not initialized for this request.'], 500);
            }
        }

        if (! Auth::guard($authGuard)->attempt([
            'email' => $payload['email'],
            'password' => $payload['password'],
        ])) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::guard($authGuard)->user();
        $userType = CenterMembership::userTypeForGuard($authGuard);

        if ($center && in_array($authGuard, ['parent', 'student'], true)) {
            $this->memberships->assignMembership($center, (int) $user->id, $userType, CenterMembership::STATUS_ASSIGNED);
        }

        return $this->establishSession(
            $request,
            $authGuard,
            $roleMap,
            $center,
            (int) $user->id,
            $center?->id,
            $centerSlug,
            (string) $user->email,
            $userType,
        );
    }

    protected function establishSession(
        Request $request,
        string $authGuard,
        array $roleMap,
        ?Center $center,
        int $profileId,
        ?string $centerId,
        ?string $centerSlug,
        ?string $profileEmail,
        ?string $userType = null,
    ): JsonResponse {
        if ($center) {
            $this->centerContext->initialize($center);
        }

        Auth::guard($authGuard)->loginUsingId($profileId);

        $request->session()->regenerate();
        $request->session()->put('api_auth_guard', $authGuard);
        $request->session()->put('api_center_id', $centerId);
        $request->session()->put('api_center_slug', $centerSlug);
        $request->session()->put('api_tenant_id', $centerId);
        $request->session()->put('api_tenant_slug', $centerSlug);
        $request->session()->put('api_auth_user_id', $profileId);
        $request->session()->forget(['api_portal_mode', 'api_global_user_id']);

        if ($profileEmail) {
            $request->session()->put('api_profile_email', $profileEmail);
        }

        if ($userType) {
            $request->session()->put('api_profile_user_type', $userType);
        }

        $user = Auth::guard($authGuard)->user();

        $memberships = null;
        if ($profileEmail && $userType) {
            $memberships = $this->memberships->listMemberships($profileEmail, $userType)->values();
        }

        $apiToken = ApiBearerAuth::issue($authGuard, $profileId, $centerId, $centerSlug, $profileEmail, $userType);

        return response()->json([
            'token' => $apiToken,
            'memberships' => $memberships,
            'user' => [
                'id' => $user->id,
                'name' => $user->name ?? $user->parent_name ?? 'User',
                'email' => $user->email,
                'role' => $roleMap[$authGuard] ?? 'admin',
                'locale' => app()->getLocale(),
                'created_at' => optional($user->created_at)->toDateString() ?? now()->toDateString(),
                'center_id' => $centerId,
                'center_slug' => $centerSlug,
                'center_name' => $center?->name,
                'tenant_id' => $centerId,
                'tenant_slug' => $centerSlug,
                'tenant_name' => $center?->name,
            ],
        ]);
    }
}
