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
            'center_slug' => ['nullable', 'string', 'max:100'],
            'tenant_slug' => ['nullable', 'string', 'max:100'],
        ]);

        $phone = $payload['phone'];

        $academicYear = now()->year.'-'.(now()->year + 1);
        $insert = [
            'name' => $payload['name'],
            'code' => $this->generateStudentCode(),
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'gender' => $payload['gender'],
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
        $center = $this->resolveRegistrationCenter($payload['center_slug'] ?? $payload['tenant_slug'] ?? null);

        if ($center) {
            $this->memberships->assignMembership($center, $studentId, Student::class);
        }

        return response()->json([
            'message' => $center
                ? 'Student account created successfully. You can sign in now.'
                : 'Student account created successfully. Sign in after your center completes enrollment.',
            'user' => [
                'id' => $studentId,
                'name' => $payload['name'],
                'email' => $payload['email'],
                'phone' => $phone,
                'code' => $insert['code'],
                'role' => 'student',
                'center_slug' => $center?->slug,
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
