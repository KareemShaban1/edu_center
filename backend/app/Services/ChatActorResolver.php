<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterContextManager;
use App\Http\Support\ApiBearerAuth;
use App\Models\Parents;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Support\Chat\ChatActor;
use App\Support\Chat\ChatIdentity;
use App\Support\Chat\ChatScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatActorResolver
{
    public function __construct(
        private readonly CenterContextManager $centerContext,
    ) {}

    public function fromRequest(Request $request): ?ChatActor
    {
        $guard = (string) $request->session()->get('api_auth_guard', '');
        $bearer = ApiBearerAuth::resolve($request);

        if ($guard === '' && $bearer) {
            $guard = (string) ($bearer['guard'] ?? '');
        }

        return match ($guard) {
            'web' => $this->resolveAdmin($request, $bearer),
            'teacher' => $this->resolveTeacher($request, $bearer),
            'student' => $this->resolveStudent($request, $bearer),
            'parent' => $this->resolveParent($request, $bearer),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>|null  $bearer
     */
    private function resolveAdmin(Request $request, ?array $bearer): ?ChatActor
    {
        $userId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id') ?? ($bearer['user_id'] ?? null);
        if (! $userId) {
            return null;
        }

        return ChatScope::withoutCenter(function () use ($request, $userId) {
            $user = User::query()->find((int) $userId);
            if (! $user) {
                return null;
            }

            $centerId = (int) ($user->center_id ?: $request->session()->get('api_tenant_id') ?: 0);
            if ($centerId < 1) {
                return null;
            }

            $this->initializeCenter($centerId);

            return new ChatActor(
                ChatActor::TYPE_ADMIN,
                (string) $user->name,
                $user->email ? (string) $user->email : null,
                [new ChatIdentity(ChatActor::TYPE_ADMIN, (int) $user->id, $centerId)],
            );
        });
    }

    /**
     * @param  array<string, mixed>|null  $bearer
     */
    private function resolveTeacher(Request $request, ?array $bearer): ?ChatActor
    {
        $teacherId = Auth::guard('teacher')->id() ?? $request->session()->get('api_auth_user_id') ?? ($bearer['user_id'] ?? null);
        if (! $teacherId) {
            return null;
        }

        return ChatScope::withoutCenter(function () use ($request, $teacherId) {
            $teacher = Teacher::query()->find((int) $teacherId);
            if (! $teacher) {
                return null;
            }

            $centerId = (int) ($teacher->center_id ?: $request->session()->get('api_tenant_id') ?: 0);
            if ($centerId < 1) {
                return null;
            }

            $this->initializeCenter($centerId);

            return new ChatActor(
                ChatActor::TYPE_TEACHER,
                (string) $teacher->name,
                $teacher->email ? (string) $teacher->email : null,
                [new ChatIdentity(ChatActor::TYPE_TEACHER, (int) $teacher->id, $centerId)],
            );
        });
    }

    /**
     * @param  array<string, mixed>|null  $bearer
     */
    private function resolveStudent(Request $request, ?array $bearer): ?ChatActor
    {
        $portal = (bool) $request->session()->get('api_portal_mode') || (bool) ($bearer['portal'] ?? false);
        $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
        $studentId = Auth::guard('student')->id() ?? $request->session()->get('api_auth_user_id') ?? ($bearer['user_id'] ?? null);

        return ChatScope::withoutCenter(function () use ($portal, $email, $studentId) {
            $query = DB::connection('center')->table('students')->whereNull('deleted_at');
            if (is_string($email) && trim($email) !== '') {
                $query->where('email', $email);
            } elseif ($studentId) {
                $query->where('id', (int) $studentId);
            } else {
                return null;
            }

            $rows = $query->get(['id', 'name', 'email']);
            if ($rows->isEmpty()) {
                return null;
            }

            $ids = $rows->pluck('id')->map(fn ($id) => (int) $id)->all();
            $memberships = CenterMembership::query()
                ->where('user_type', Student::class)
                ->whereIn('user_id', $ids)
                ->where('status', CenterMembership::STATUS_ASSIGNED)
                ->get();

            $identities = [];
            foreach ($memberships as $membership) {
                $identities[] = new ChatIdentity(
                    ChatActor::TYPE_STUDENT,
                    (int) $membership->user_id,
                    (int) $membership->center_id,
                );
            }

            if ($identities === []) {
                return null;
            }

            $first = $rows->first();

            return new ChatActor(
                ChatActor::TYPE_STUDENT,
                (string) ($first->name ?? ''),
                isset($first->email) ? (string) $first->email : null,
                $identities,
                $portal,
            );
        });
    }

    /**
     * @param  array<string, mixed>|null  $bearer
     */
    private function resolveParent(Request $request, ?array $bearer): ?ChatActor
    {
        $portal = (bool) $request->session()->get('api_portal_mode') || (bool) ($bearer['portal'] ?? false);
        $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
        $parentId = Auth::guard('parent')->id() ?? $request->session()->get('api_auth_user_id') ?? ($bearer['user_id'] ?? null);

        return ChatScope::withoutCenter(function () use ($portal, $email, $parentId) {
            $query = DB::connection('center')->table('parents');
            if (is_string($email) && trim($email) !== '') {
                $query->where('email', $email);
            } elseif ($parentId) {
                $query->where('id', (int) $parentId);
            } else {
                return null;
            }

            $rows = $query->get(['id', 'parent_name', 'email']);
            if ($rows->isEmpty()) {
                return null;
            }

            $parentIds = $rows->pluck('id')->map(fn ($id) => (int) $id)->all();
            $seen = [];
            $identities = [];

            $parentMemberships = CenterMembership::query()
                ->where('user_type', Parents::class)
                ->whereIn('user_id', $parentIds)
                ->where('status', CenterMembership::STATUS_ASSIGNED)
                ->get();

            foreach ($parentMemberships as $membership) {
                $key = $membership->user_id.':'.$membership->center_id;
                $seen[$key] = true;
                $identities[] = new ChatIdentity(
                    ChatActor::TYPE_PARENT,
                    (int) $membership->user_id,
                    (int) $membership->center_id,
                );
            }

            $childQuery = DB::connection('center')->table('students')
                ->whereIn('parent_id', $parentIds);
            if ($this->studentsHaveDeletedAt()) {
                $childQuery->whereNull('deleted_at');
            }
            $children = $childQuery->get(['id', 'parent_id']);

            if ($children->isNotEmpty()) {
                $childMemberships = CenterMembership::query()
                    ->where('user_type', Student::class)
                    ->whereIn('user_id', $children->pluck('id')->map(fn ($id) => (int) $id)->all())
                    ->where('status', CenterMembership::STATUS_ASSIGNED)
                    ->get()
                    ->groupBy('user_id');

                foreach ($children as $child) {
                    $childId = (int) $child->id;
                    $linkedParentId = (int) $child->parent_id;
                    foreach ($childMemberships->get($childId, collect()) as $membership) {
                        $key = $linkedParentId.':'.$membership->center_id;
                        if (isset($seen[$key])) {
                            continue;
                        }
                        $seen[$key] = true;
                        $identities[] = new ChatIdentity(
                            ChatActor::TYPE_PARENT,
                            $linkedParentId,
                            (int) $membership->center_id,
                        );
                    }
                }
            }

            if ($identities === []) {
                return null;
            }

            $first = $rows->first();

            return new ChatActor(
                ChatActor::TYPE_PARENT,
                (string) ($first->parent_name ?? ''),
                isset($first->email) ? (string) $first->email : null,
                $identities,
                $portal,
            );
        });
    }

    private function initializeCenter(int $centerId): void
    {
        $center = Center::query()->find($centerId);
        if ($center) {
            $this->centerContext->initialize($center);
        }
    }

    private function studentsHaveDeletedAt(): bool
    {
        static $has = null;
        if ($has === null) {
            $has = DB::connection('center')->getSchemaBuilder()->hasColumn('students', 'deleted_at');
        }

        return (bool) $has;
    }
}
