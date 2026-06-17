<?php

declare(strict_types=1);

namespace App\Centers;

use App\Models\Parents;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CenterMembershipService
{
    public function isEnabled(): bool
    {
        return (bool) config('centers.global_identity.enabled', true);
    }

    public function multiCenterRoles(): array
    {
        return config('centers.global_identity.roles', ['parent', 'student']);
    }

    public function roleSupportsMultipleCenters(string $authGuard): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        if ($authGuard === 'student') {
            return in_array(CenterMembership::ROLE_STUDENT, $this->multiCenterRoles(), true);
        }

        if ($authGuard === 'parent') {
            return in_array(CenterMembership::ROLE_PARENT, $this->multiCenterRoles(), true);
        }

        return false;
    }

    /** @return array{email: string, name: string, user_type: string}|null */
    public function authenticate(string $email, string $password, ?string $role = null): ?array
    {
        $userTypes = $this->resolveUserTypes($role);
        $matched = [];

        foreach ($userTypes as $userType) {
            foreach ($this->findMatchingProfiles($email, $password, $userType) as $item) {
                $matched[] = $item;
            }
        }

        if ($matched === []) {
            return null;
        }

        foreach ($matched as $item) {
            $this->assignMembership(
                $item['center'],
                (int) $item['profile_id'],
                $item['user_type'],
                CenterMembership::STATUS_ASSIGNED
            );
        }

        return [
            'email' => $email,
            'name' => (string) $matched[0]['name'],
            'user_type' => (string) $matched[0]['user_type'],
        ];
    }

    /** @return list<string> */
    protected function resolveUserTypes(?string $role): array
    {
        if ($role === CenterMembership::ROLE_STUDENT) {
            return [Student::class];
        }

        if ($role === CenterMembership::ROLE_PARENT) {
            return [Parents::class];
        }

        return [Student::class, Parents::class];
    }

    /** @return list<array{center: Center, profile_id: int, user_type: string, name: string}> */
    protected function findMatchingProfiles(string $email, string $password, string $userType): array
    {
        $table = $userType === Student::class ? 'students' : 'parents';
        $nameColumn = $userType === Student::class ? 'name' : 'parent_name';
        $role = CenterMembership::roleForUserType($userType);

        $query = DB::connection('center')->table($table)->where('email', $email);
        if ($userType === Student::class && $this->tableHasColumn($table, 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $matched = [];

        foreach ($query->get() as $profile) {
            if (! Hash::check($password, (string) $profile->password)) {
                continue;
            }

            $centerId = $this->resolveCenterIdForProfile($profile, $role);
            if (! $centerId) {
                continue;
            }

            $center = Center::query()->find($centerId);
            if (! $center) {
                continue;
            }

            $matched[] = [
                'center' => $center,
                'profile_id' => (int) $profile->id,
                'user_type' => $userType,
                'name' => (string) ($profile->{$nameColumn} ?? 'User'),
            ];
        }

        return $matched;
    }

    public function resolveCenterIdForProfile(object $profile, string $role): ?string
    {
        $membershipQuery = CenterMembership::query()
            ->where('user_id', (int) $profile->id)
            ->where('user_type', $role === CenterMembership::ROLE_STUDENT ? Student::class : Parents::class);

        $existingCenterId = $membershipQuery->value('center_id');
        if ($existingCenterId) {
            return (string) $existingCenterId;
        }

        if ($role === CenterMembership::ROLE_STUDENT) {
            if (! empty($profile->section_id)) {
                $section = DB::connection('center')->table('sections')->where('id', $profile->section_id)->first();
                if ($section?->center_id) {
                    return (string) $section->center_id;
                }
            }

            if (! empty($profile->grade_id)) {
                $grade = DB::connection('center')->table('grades')->where('id', $profile->grade_id)->first();
                if ($grade?->center_id) {
                    return (string) $grade->center_id;
                }
            }
        }

        if ($role === CenterMembership::ROLE_PARENT) {
            $student = DB::connection('center')->table('students')
                ->where('parent_id', $profile->id)
                ->when($this->tableHasColumn('students', 'deleted_at'), fn ($q) => $q->whereNull('deleted_at'))
                ->first();

            if ($student?->section_id) {
                $section = DB::connection('center')->table('sections')->where('id', $student->section_id)->first();
                if ($section?->center_id) {
                    return (string) $section->center_id;
                }
            }
        }

        if ($contextCenterId = CenterContext::id()) {
            return $contextCenterId;
        }

        if (Center::query()->count() === 1) {
            return (string) Center::query()->value('id');
        }

        return null;
    }

    protected function tableHasColumn(string $table, string $column): bool
    {
        return in_array($column, DB::connection('center')->getSchemaBuilder()->getColumnListing($table), true);
    }

    /** @return Collection<int, array<string, mixed>> */
    public function listMemberships(string $email, string $userType): Collection
    {
        $profileIds = $this->profileIdsForEmail($email, $userType);
        if ($profileIds === []) {
            return collect();
        }

        return CenterMembership::query()
            ->where('user_type', $userType)
            ->whereIn('user_id', $profileIds)
            ->where('status', CenterMembership::STATUS_ASSIGNED)
            ->get()
            ->map(fn (CenterMembership $membership) => $this->formatMembership($membership));
    }

    public function resolveMembership(
        string $email,
        string $userType,
        ?string $centerSlug = null,
        ?string $centerId = null
    ): ?CenterMembership {
        $profileIds = $this->profileIdsForEmail($email, $userType);
        if ($profileIds === []) {
            return null;
        }

        $query = CenterMembership::query()
            ->where('user_type', $userType)
            ->whereIn('user_id', $profileIds)
            ->where('status', CenterMembership::STATUS_ASSIGNED);

        if ($centerId) {
            return $query->where('center_id', $centerId)->first();
        }

        if ($centerSlug) {
            $center = Center::query()->where('slug', $centerSlug)->first();
            if (! $center) {
                return null;
            }

            return $query->where('center_id', $center->id)->first();
        }

        return $query->count() === 1 ? $query->first() : null;
    }

    public function findMembershipById(string $email, string $userType, int $membershipId): ?CenterMembership
    {
        $membership = CenterMembership::query()
            ->where('id', $membershipId)
            ->where('user_type', $userType)
            ->where('status', CenterMembership::STATUS_ASSIGNED)
            ->first();

        if (! $membership) {
            return null;
        }

        $profileIds = $this->profileIdsForEmail($email, $userType);
        if (! in_array((int) $membership->user_id, $profileIds, true)) {
            return null;
        }

        return $membership;
    }

    public function assignMembership(
        Center $center,
        int $userId,
        string $userType,
        string $status = CenterMembership::STATUS_ASSIGNED
    ): CenterMembership {
        return CenterMembership::query()->updateOrCreate(
            [
                'center_id' => $center->id,
                'user_id' => $userId,
                'user_type' => $userType,
            ],
            [
                'status' => $status,
            ]
        );
    }

    public function registerStudentProfile(int $studentId): ?CenterMembership
    {
        $center = CenterContext::center();

        return $center
            ? $this->assignMembership($center, $studentId, Student::class, CenterMembership::STATUS_ASSIGNED)
            : null;
    }

    public function registerParentProfile(int $parentId): ?CenterMembership
    {
        $center = CenterContext::center();

        return $center
            ? $this->assignMembership($center, $parentId, Parents::class, CenterMembership::STATUS_ASSIGNED)
            : null;
    }

    /** @return list<int> */
    protected function profileIdsForEmail(string $email, string $userType): array
    {
        $table = $userType === Student::class ? 'students' : 'parents';
        $query = DB::connection('center')->table($table)->where('email', $email);

        if ($userType === Student::class && $this->tableHasColumn($table, 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        return $query->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    protected function formatMembership(CenterMembership $membership): array
    {
        $center = Center::query()->find($membership->center_id);
        $role = CenterMembership::roleForUserType((string) $membership->user_type);

        return [
            'membership_id' => $membership->id,
            'center_id' => $membership->center_id,
            'tenant_id' => $membership->center_id,
            'center_slug' => $center?->slug,
            'tenant_slug' => $center?->slug,
            'center_name' => $center?->name,
            'tenant_name' => $center?->name,
            'role' => $role,
            'profile_id' => (int) $membership->user_id,
            'user_id' => (int) $membership->user_id,
            'user_type' => $membership->user_type,
            'status' => $membership->status,
        ];
    }
}

/** @deprecated Use CenterMembershipService */
class GlobalMembershipService extends CenterMembershipService
{
}
