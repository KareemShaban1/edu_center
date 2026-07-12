<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait ResolvesStudentApiContext
{
    use ResolvesCenterApiContext;

    /**
     * @return array{error: JsonResponse|null, tenantDb: \Illuminate\Database\Connection|null, studentId: int|null, student: object|null}
     */
    protected function resolveStudentContext(Request $request): array
    {
        $guard = $request->session()->get('api_auth_guard', 'student');
        if ($guard !== 'student') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403), 'tenantDb' => null, 'studentId' => null, 'student' => null];
        }

        $bearer = ApiBearerAuth::resolve($request);
        $portalMode = $request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');

        if ($bearer) {
            $tenantId = $bearer['tenant_id'] ?: $tenantId;
            $tenantSlug = $bearer['tenant_slug'] ?: $tenantSlug;
        }

        $centerIdHint = $request->input('center_id')
            ?? $request->header('X-Center-Id')
            ?? $request->query('center_id');
        $centerSlugHint = $request->input('center_slug')
            ?? $request->header('X-Center-Slug')
            ?? $request->query('center_slug')
            ?? $tenantSlug;

        $resolvePortalMemberships = function () use ($request, $bearer, $portalMode): \Illuminate\Support\Collection {
            if (! $portalMode) {
                return collect();
            }

            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type', Student::class)
                ?: ($bearer['user_type'] ?? Student::class);
            if (! is_string($email) || trim($email) === '') {
                return collect();
            }

            $profileIds = DB::connection('center')->table('students')
                ->where('email', $email)
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();

            if ($profileIds === []) {
                return collect();
            }

            return CenterMembership::query()
                ->where('user_type', $userType)
                ->whereIn('user_id', $profileIds)
                ->where('status', CenterMembership::STATUS_ASSIGNED)
                ->get();
        };

        $tenant = $this->resolveCenter($tenantId, is_string($centerSlugHint) && $centerSlugHint !== '' ? $centerSlugHint : $tenantSlug);
        $studentId = null;

        if (! $tenant && $centerIdHint) {
            $tenant = Center::query()->find((int) $centerIdHint);
        }

        if (! $tenant && $portalMode) {
            $memberships = $resolvePortalMemberships();
            if ($centerIdHint) {
                $memberships = $memberships->where('center_id', (int) $centerIdHint)->values();
            } elseif (is_string($centerSlugHint) && $centerSlugHint !== '') {
                $centerBySlug = Center::query()->where('slug', $centerSlugHint)->first();
                if (! $centerBySlug) {
                    return ['error' => response()->json(['message' => 'Tenant not found'], 422), 'tenantDb' => null, 'studentId' => null, 'student' => null];
                }
                $memberships = $memberships->where('center_id', $centerBySlug->id)->values();
            }

            if ($memberships->isEmpty()) {
                return ['error' => response()->json(['message' => 'Tenant not found'], 422), 'tenantDb' => null, 'studentId' => null, 'student' => null];
            }
            if ($memberships->count() > 1) {
                return ['error' => response()->json([
                    'message' => 'Center context required',
                    'requires_center_selection' => true,
                ], 422), 'tenantDb' => null, 'studentId' => null, 'student' => null];
            }

            $membership = $memberships->first();
            $tenant = Center::query()->find($membership->center_id);
            $studentId = (int) $membership->user_id;
        }

        if (! $tenant) {
            return ['error' => response()->json(['message' => 'Tenant not found'], 422), 'tenantDb' => null, 'studentId' => null, 'student' => null];
        }
        $this->ensureTenantInitialized($tenant);

        if ($studentId === null) {
            $studentId = Auth::guard('student')->id() ?? $request->session()->get('api_auth_user_id');
        }
        if (! $studentId && $portalMode) {
            $memberships = $resolvePortalMemberships()->where('center_id', $tenant->id)->values();
            if ($memberships->count() === 1) {
                $studentId = (int) $memberships->first()->user_id;
            } elseif ($memberships->count() > 1 && $centerIdHint) {
                $membership = $memberships->firstWhere('center_id', (int) $centerIdHint);
                if ($membership) {
                    $studentId = (int) $membership->user_id;
                }
            }
        }
        if (! $studentId) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401), 'tenantDb' => null, 'studentId' => null, 'student' => null];
        }

        $tenantDb = DB::connection('center');
        $student = $tenantDb->table('students')->where('id', $studentId)->first();
        if (! $student) {
            return ['error' => response()->json(['message' => 'Student not found'], 404), 'tenantDb' => null, 'studentId' => null, 'student' => null];
        }

        return ['error' => null, 'tenantDb' => $tenantDb, 'studentId' => (int) $studentId, 'student' => $student];
    }
}
