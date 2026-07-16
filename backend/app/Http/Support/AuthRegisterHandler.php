<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Centers\CenterMembershipService;
use App\Models\Parents;
use App\Models\Platform\Center;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AuthRegisterHandler
{
    public function __construct(
        protected CenterMembershipService $memberships,
    ) {
    }

    public function registerParent(Request $request): JsonResponse
    {
        if ($request->filled('phone')) {
            $request->merge(['phone' => $this->normalizePhone((string) $request->input('phone'))]);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.parents,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:mysql.parents,parent_phone'],
            'password' => ['required', 'string', 'min:6', 'max:100', 'confirmed'],
            'center_slug' => ['nullable', 'string', 'max:100'],
            'tenant_slug' => ['nullable', 'string', 'max:100'],
        ]);

        $phone = $payload['phone'];

        $insert = [
            'parent_name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'parent_phone' => $phone,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::connection('mysql')->hasColumn('parents', 'is_active')) {
            $insert['is_active'] = true;
        }

        $parentId = (int) DB::connection('mysql')->table('parents')->insertGetId($insert);
        $center = $this->resolveRegistrationCenter($payload['center_slug'] ?? $payload['tenant_slug'] ?? null);

        if ($center) {
            $this->memberships->assignMembership($center, $parentId, Parents::class);
        }

        return response()->json([
            'message' => $center
                ? 'Parent account created successfully. You can sign in now.'
                : 'Parent account created successfully. Sign in after your center links your account.',
            'user' => [
                'id' => $parentId,
                'name' => $payload['name'],
                'email' => $payload['email'],
                'phone' => $phone,
                'role' => 'parent',
                'center_slug' => $center?->slug,
            ],
        ], 201);
    }

    public function registerStudent(Request $request): JsonResponse
    {
        if ($request->filled('phone')) {
            $request->merge(['phone' => $this->normalizePhone((string) $request->input('phone'))]);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.students,email'],
            'phone' => ['required', 'string', 'max:20', Rule::when(
                Schema::connection('mysql')->hasColumn('students', 'phone'),
                ['unique:mysql.students,phone']
            )],
            'password' => ['required', 'string', 'min:6', 'max:100', 'confirmed'],
            'gender' => ['required', 'in:male,female'],
            'center_slug' => ['required', 'string', 'max:100'],
            'tenant_slug' => ['nullable', 'string', 'max:100'],
            'grade_id' => ['required', 'integer', 'min:1'],
            'class_id' => ['required', 'integer', 'min:1'],
            'section_id' => ['required', 'integer', 'min:1'],
        ]);

        $phone = $payload['phone'];
        $center = $this->resolveRegistrationCenter($payload['center_slug'] ?? $payload['tenant_slug'] ?? null);
        if (! $center) {
            return response()->json(['message' => 'Center not found'], 422);
        }

        $gradeId = (int) $payload['grade_id'];
        $classId = (int) $payload['class_id'];
        $sectionId = (int) $payload['section_id'];

        try {
            app(\App\Centers\CenterContextManager::class)->initialize($center);
            $db = DB::connection('center');

            if (! Schema::connection('center')->hasTable('grades')
                || ! Schema::connection('center')->hasTable('classes')
                || ! Schema::connection('center')->hasTable('sections')) {
                return response()->json(['message' => 'Academic structure unavailable for this center'], 422);
            }

            $gradeExists = $db->table('grades')->where('id', $gradeId)->exists();
            $class = $db->table('classes')->where('id', $classId)->where('grade_id', $gradeId)->first();
            $sectionQuery = $db->table('sections')->where('id', $sectionId)->where('class_id', $classId);
            if (Schema::connection('center')->hasColumn('sections', 'grade_id')) {
                $sectionQuery->where('grade_id', $gradeId);
            }
            $sectionExists = $sectionQuery->exists();

            if (! $gradeExists || ! $class || ! $sectionExists) {
                return response()->json([
                    'message' => 'Invalid grade, class, or section for the selected center.',
                    'errors' => [
                        'section_id' => ['Select a valid grade, class, and section for this center.'],
                    ],
                ], 422);
            }
        } finally {
            app(\App\Centers\CenterContextManager::class)->end();
        }

        $academicYear = now()->year.'-'.(now()->year + 1);
        $insert = [
            'name' => $payload['name'],
            'code' => $this->generateStudentCode(),
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'gender' => $payload['gender'],
            'grade_id' => $gradeId,
            'class_id' => $classId,
            'section_id' => $sectionId,
            'academic_year' => $academicYear,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::connection('mysql')->hasColumn('students', 'phone')) {
            $insert['phone'] = $phone;
        }

        if (Schema::connection('mysql')->hasColumn('students', 'is_active')) {
            $insert['is_active'] = true;
        }

        $studentId = (int) DB::connection('mysql')->table('students')->insertGetId($insert);
        $this->memberships->assignMembership($center, $studentId, Student::class);

        return response()->json([
            'message' => 'Student account created successfully. You can sign in now.',
            'user' => [
                'id' => $studentId,
                'name' => $payload['name'],
                'email' => $payload['email'],
                'phone' => $phone,
                'code' => $insert['code'],
                'role' => 'student',
                'center_slug' => $center->slug,
                'grade_id' => $gradeId,
                'class_id' => $classId,
                'section_id' => $sectionId,
            ],
        ], 201);
    }

    protected function normalizePhone(string $phone): string
    {
        return preg_replace('/\s+/', '', trim($phone)) ?? trim($phone);
    }

    protected function generateStudentCode(): string
    {
        $next = ((int) DB::connection('mysql')->table('students')->max('id')) + 1;

        do {
            $code = 'STU-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            $next++;
        } while (DB::connection('mysql')->table('students')->where('code', $code)->exists());

        return $code;
    }

    protected function resolveRegistrationCenter(?string $slug): ?Center
    {
        if (is_string($slug) && trim($slug) !== '') {
            $center = Center::query()->where('slug', trim($slug))->first();

            return $center ?: null;
        }

        if (Center::query()->count() === 1) {
            return Center::query()->first();
        }

        return null;
    }
}
