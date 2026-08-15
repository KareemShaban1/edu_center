<?php

namespace Database\Seeders\Center;

use App\Centers\CenterContext;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * CRUD modules that match current admin sidebar / dashboard links.
     * Dashboard, todos, and notes stay reachable without extra checks;
     * todos/notes are still seeded so they can be granted like other pages.
     *
     * @var array<string, string> plural => singular
     */
    private const MODULES = [
        'students' => 'student',
        'teachers' => 'teacher',
        'parents' => 'parent',
        'grades' => 'grade',
        'classes' => 'class',
        'sections' => 'section',
        'units' => 'unit',
        'lessons' => 'lesson',
        'homework' => 'homework',
        'library' => 'library',
        'sessions' => 'session',
        'attendance' => 'attendance',
        'exams' => 'exam',
        'quizzes' => 'quiz',
        'fees' => 'fee',
        'payments' => 'payment',
        'announcements' => 'announcement',
        'notifications' => 'notification',
        'whatsapp' => 'whatsapp',
        'certifications' => 'certification',
        'landing' => 'landing',
        'reports' => 'report',
        'users' => 'user',
        'roles' => 'role',
        'settings' => 'setting',
        'todos' => 'todo',
        'notes' => 'note',
    ];

    public function run()
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guard = 'web';
        $centerId = CenterContext::hasCenter() ? CenterContext::id() : null;
        $permissionNames = [];

        foreach (self::MODULES as $plural => $singular) {
            foreach ($this->crudNames($plural, $singular) as $name) {
                $permissionNames[] = $name;
                $this->ensurePermission($name, $guard, $centerId);
            }
        }

        $userRole = Role::firstOrCreate(
            $this->roleLookup('user', $guard, $centerId),
            $this->roleLookup('user', $guard, $centerId),
        );
        $userRole->syncPermissions(
            array_values(array_intersect($permissionNames, ['view todos', 'view notes']))
        );

        $adminRole = Role::firstOrCreate(
            $this->roleLookup('admin', $guard, $centerId),
            $this->roleLookup('admin', $guard, $centerId),
        );

        $permissionQuery = Permission::where('guard_name', $guard)->whereIn('name', $permissionNames);
        if ($centerId) {
            $permissionQuery->where('center_id', $centerId);
        }
        $adminRole->syncPermissions($permissionQuery->get());
    }

    /** @return list<string> */
    private function crudNames(string $plural, string $singular): array
    {
        if ($plural === 'reports') {
            return ["view {$plural}"];
        }

        return [
            "view {$plural}",
            "create {$singular}",
            "update {$singular}",
            "delete {$singular}",
        ];
    }

    private function ensurePermission(string $name, string $guard, ?int $centerId): void
    {
        $lookup = ['name' => $name, 'guard_name' => $guard];
        $attributes = ['name' => $name, 'guard_name' => $guard];
        if ($centerId) {
            $lookup['center_id'] = $centerId;
            $attributes['center_id'] = $centerId;
        }

        Permission::firstOrCreate($lookup, $attributes);
    }

    /** @return array{name: string, guard_name: string, center_id?: int} */
    private function roleLookup(string $name, string $guard, ?int $centerId): array
    {
        $lookup = ['name' => $name, 'guard_name' => $guard];
        if ($centerId) {
            $lookup['center_id'] = $centerId;
        }

        return $lookup;
    }
}
