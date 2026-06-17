<?php

declare(strict_types=1);

namespace App\Centers;

use App\Models\Parents;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use App\Models\Section;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CenterProvisionerService
{
    public function __construct(
        protected CenterMembershipService $memberships,
        protected CenterContextManager $centerContext,
    ) {
    }

    /**
     * @param  array<string, mixed>|null  $overrides  Optional keys: admin, teachers[], parents[], students[]
     * @return array{accounts: list<array{role: string, name: string, email: string, password: string}>}
     */
    public function provisionDefaults(Center $center, ?array $overrides = null, bool $seedDefaults = true): array
    {
        $this->centerContext->initialize($center);

        try {
            $slug = $center->slug ?: $center->id;
            $accounts = [];
            $overrides = $overrides ?? [];

            $shouldCreateAdmin = $seedDefaults || ! empty($overrides['admin']);
            if ($shouldCreateAdmin) {
                $accounts[] = $this->createAdmin($slug, $overrides['admin'] ?? null);
            }

            if ($seedDefaults) {
                if (empty($overrides['teachers'])) {
                    $accounts[] = $this->createTeacher($slug, $overrides['teacher'] ?? null);
                }

                $defaultParent = null;
                if (empty($overrides['parents'])) {
                    $defaultParent = $this->createParent($slug, $overrides['parent'] ?? null);
                    $accounts[] = $defaultParent;
                }

                if (empty($overrides['students']) && $defaultParent) {
                    $accounts[] = $this->createStudent(
                        $slug,
                        (int) $defaultParent['profile_id'],
                        $overrides['student'] ?? null
                    );
                }
            }

            foreach ($overrides['teachers'] ?? [] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $accounts[] = $this->createTeacher($slug, $row, append: true);
            }

            foreach ($overrides['parents'] ?? [] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $accounts[] = $this->createParent($slug, $row, append: true);
            }

            $fallbackParentId = null;
            foreach ($accounts as $account) {
                if ($account['role'] === 'parent') {
                    $fallbackParentId = (int) $account['profile_id'];
                    break;
                }
            }

            foreach ($overrides['students'] ?? [] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $parentId = isset($row['parent_id'])
                    ? (int) $row['parent_id']
                    : ($fallbackParentId ?? 0);
                if ($parentId <= 0) {
                    continue;
                }
                $accounts[] = $this->createStudent($slug, $parentId, $row, append: true);
            }

            return ['accounts' => $accounts];
        } finally {
            $this->centerContext->end();
        }
    }

    /** @param  array<string, mixed>|null  $custom */
    protected function createAdmin(string $slug, ?array $custom): array
    {
        $email = $custom['email'] ?? $this->defaultEmail('admin', $slug);
        $password = $custom['password'] ?? 'password';
        $name = $custom['name'] ?? 'Center Admin';
        $centerId = CenterContext::id();

        $user = User::query()->updateOrCreate(
            [
                'email' => $email,
                'center_id' => $centerId,
            ],
            [
                'name' => $name,
                'password' => Hash::make($password),
            ]
        );

        $adminRole = Role::query()
            ->where('name', 'admin')
            ->where('guard_name', 'web')
            ->when($centerId, fn ($query) => $query->where('center_id', $centerId))
            ->first();

        if ($adminRole && ! $user->hasRole($adminRole)) {
            $user->assignRole($adminRole);
        }

        return $this->accountRow('admin', $name, $email, $password, (int) $user->id);
    }

    /** @param  array<string, mixed>|null  $custom */
    protected function createTeacher(string $slug, ?array $custom, bool $append = false): array
    {
        $email = $custom['email'] ?? ($append ? null : $this->defaultEmail('teacher', $slug));
        if (! $email) {
            $email = 'teacher-'.uniqid('', false).'@educenter.com';
        }

        $password = $custom['password'] ?? 'password';
        $name = $custom['name'] ?? ($append ? 'Teacher' : 'Default Teacher');

        $teacher = Teacher::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'subject' => $custom['subject'] ?? 'General',
                'address' => $custom['address'] ?? 'Main Branch',
                'phone' => $custom['phone'] ?? '01000000000',
                'gender' => $custom['gender'] ?? 'male',
                'joining_date' => now(),
            ]
        );

        return $this->accountRow('teacher', $name, $email, $password, (int) $teacher->id);
    }

    /** @param  array<string, mixed>|null  $custom */
    protected function createParent(string $slug, ?array $custom, bool $append = false): array
    {
        $email = $custom['email'] ?? ($append ? null : $this->defaultEmail('parent', $slug));
        if (! $email) {
            $email = 'parent-'.uniqid('', false).'@educenter.com';
        }

        $password = $custom['password'] ?? 'password';
        $name = $custom['name'] ?? ($append ? 'Parent' : 'Default Parent');

        $parent = Parents::updateOrCreate(
            ['email' => $email],
            [
                'parent_name' => $name,
                'password' => Hash::make($password),
                'parent_phone' => $custom['phone'] ?? '01000000001',
                'parent_job' => $custom['job'] ?? 'Parent',
                'parent_address' => $custom['address'] ?? 'Cairo',
                'is_active' => true,
            ]
        );

        $center = CenterContext::center();
        if ($center) {
            $this->memberships->assignMembership($center, (int) $parent->id, Parents::class, CenterMembership::STATUS_ASSIGNED);
        }

        return $this->accountRow('parent', $name, $email, $password, (int) $parent->id);
    }

    /** @param  array<string, mixed>|null  $custom */
    protected function createStudent(string $slug, int $parentId, ?array $custom, bool $append = false): array
    {
        $email = $custom['email'] ?? ($append ? null : $this->defaultEmail('student', $slug));
        if (! $email) {
            $email = 'student-'.uniqid('', false).'@educenter.com';
        }

        $password = $custom['password'] ?? 'password';
        $name = $custom['name'] ?? ($append ? 'Student' : 'Default Student');

        $section = Section::query()->first();
        $gradeId = $section?->grade_id ?? 1;
        $classId = $section?->class_id ?? 1;
        $sectionId = $section?->id ?? 1;

        $student = Student::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'gender' => $custom['gender'] ?? 'male',
                'grade_id' => $gradeId,
                'class_id' => $classId,
                'section_id' => $sectionId,
                'parent_id' => $parentId,
                'academic_year' => (string) now()->year,
            ]
        );

        $center = CenterContext::center();
        if ($center) {
            $this->memberships->assignMembership($center, (int) $student->id, Student::class, CenterMembership::STATUS_ASSIGNED);
        }

        return $this->accountRow('student', $name, $email, $password, (int) $student->id);
    }

    protected function defaultEmail(string $role, string $slug): string
    {
        if ($slug === 'demo') {
            return "{$role}@educenter.com";
        }

        return "{$role}-{$slug}@educenter.com";
    }

    /** @return array{role: string, name: string, email: string, password: string, profile_id: int} */
    protected function accountRow(string $role, string $name, string $email, string $password, int $profileId): array
    {
        return [
            'role' => $role,
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'profile_id' => $profileId,
        ];
    }
}
