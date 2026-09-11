<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterMembershipService;
use App\Models\Parents;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

final class AdminStudentService
{
    public function __construct(
        private readonly CenterMembershipService $centerMembershipService,
    ) {}

    /**
     * Profiles (students/parents) must be readable even when not assigned to the active center.
     * The `center` connection applies membership scoping; use the default connection instead.
     */
    private function profiles(): \Illuminate\Database\Connection
    {
        return DB::connection((string) config('database.default', 'mysql'));
    }

    /**
     * @return array{student: array<string, mixed>, parent: array<string, mixed>|null}|null
     */
    public function searchByCode(string $code, Center $tenant): ?array
    {
        $code = trim($code);
        $query = $this->profiles()->table('students')->where('code', $code);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $student = $query->first();
        if (! $student) {
            return null;
        }

        $isAssigned = CenterMembership::query()
            ->where('center_id', $tenant->id)
            ->where('user_id', $student->id)
            ->where('user_type', Student::class)
            ->where('status', CenterMembership::STATUS_ASSIGNED)
            ->exists();

        $parent = null;
        if ($student->parent_id) {
            $parentRow = $this->profiles()->table('parents')->where('id', $student->parent_id)->first();
            if ($parentRow) {
                $parentAssigned = CenterMembership::query()
                    ->where('center_id', $tenant->id)
                    ->where('user_id', $parentRow->id)
                    ->where('user_type', Parents::class)
                    ->where('status', CenterMembership::STATUS_ASSIGNED)
                    ->exists();

                $parent = [
                    'id' => $parentRow->id,
                    'name' => $parentRow->parent_name,
                    'email' => $parentRow->email,
                    'is_assigned' => $parentAssigned,
                ];
            }
        }

        return [
            'student' => [
                'id' => $student->id,
                'code' => $student->code,
                'name' => $student->name,
                'email' => $student->email,
                'gender' => $student->gender,
                'parent_id' => $student->parent_id,
                'is_assigned' => $isAssigned,
            ],
            'parent' => $parent,
        ];
    }

    /**
     * @return array{message: string, student_id: int, center_id: int}|null
     */
    public function assignToCenter(Center $tenant, int $id): ?array
    {
        $studentQuery = $this->profiles()->table('students')->where('id', $id);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $studentQuery->whereNull('deleted_at');
        }

        if (! $studentQuery->exists()) {
            return null;
        }

        $this->centerMembershipService->assignStudentWithParent($tenant, $id);

        return [
            'message' => 'Student and parent assigned to center successfully.',
            'student_id' => $id,
            'center_id' => $tenant->id,
        ];
    }

    /**
     * @return array{message: string, student_id: int, center_id: int, membership_status: string}|array{message: string, status: int}|null
     */
    public function unassignFromCenter(Center $tenant, int $id): array|null
    {
        $studentQuery = $this->profiles()->table('students')->where('id', $id);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $studentQuery->whereNull('deleted_at');
        }

        if (! $studentQuery->exists()) {
            return null;
        }

        $membership = $this->centerMembershipService->unassignStudentWithParent($tenant, $id);
        if (! $membership) {
            return [
                'message' => 'Student is not assigned to this center',
                'status' => 422,
            ];
        }

        return [
            'message' => 'Student and parent unassigned from center. They can be reassigned later.',
            'student_id' => $id,
            'center_id' => $tenant->id,
            'membership_status' => CenterMembership::STATUS_NOT_ASSIGNED,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(array $payload, Center $tenant): object
    {
        $academicYear = now()->year.'-'.(now()->year + 1);
        $studentsHasIsActive = Schema::connection('center')->hasColumn('students', 'is_active');
        $insert = [
            'name' => $payload['name'],
            'code' => $payload['code'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'gender' => $payload['gender'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'parent_id' => ! empty($payload['parent_id']) ? $payload['parent_id'] : null,
            'academic_year' => $academicYear,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($studentsHasIsActive) {
            $insert['is_active'] = (($payload['status'] ?? 'active') !== 'inactive');
        }
        if (Schema::connection('center')->hasColumn('students', 'phone') && ! empty($payload['phone'])) {
            $insert['phone'] = preg_replace('/\s+/', '', trim((string) $payload['phone']));
        }

        $id = DB::connection('center')->table('students')->insertGetId($insert);

        $this->centerMembershipService->assignStudentWithParent($tenant, (int) $id);

        return $this->findStudentRow((int) $id, $payload['status'] ?? 'active');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(int $id, array $payload, Center $tenant): ?object
    {
        $studentExists = DB::connection('center')->table('students')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->exists();
        if (! $studentExists) {
            return null;
        }

        $update = [
            'name' => $payload['name'],
            'code' => $payload['code'],
            'email' => $payload['email'],
            'gender' => $payload['gender'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'parent_id' => ! empty($payload['parent_id']) ? $payload['parent_id'] : null,
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('students', 'is_active')) {
            $update['is_active'] = (($payload['status'] ?? 'active') !== 'inactive');
        }
        if (Schema::connection('center')->hasColumn('students', 'phone')) {
            $update['phone'] = ! empty($payload['phone'])
                ? preg_replace('/\s+/', '', trim((string) $payload['phone']))
                : null;
        }
        if (! empty($payload['password'])) {
            $update['password'] = Hash::make($payload['password']);
        }

        DB::connection('center')->table('students')
            ->where('id', $id)
            ->update($update);

        $this->centerMembershipService->assignStudentWithParent($tenant, $id);

        return $this->findStudentRow($id, $payload['status'] ?? 'active');
    }

    private function findStudentRow(int $id, string $fallbackStatus): object
    {
        $student = DB::connection('center')->table('students')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        $student->api_status = isset($student->is_active)
            ? ($student->is_active ? 'active' : 'inactive')
            : $fallbackStatus;
        $student->created_at = optional($student->created_at)->format('Y-m-d') ?? now()->toDateString();

        return $student;
    }
}
