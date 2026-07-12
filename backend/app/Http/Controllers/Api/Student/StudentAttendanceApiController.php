<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesStudentApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StudentAttendanceApiController extends Controller
{
    use ResolvesStudentApiContext;
    public function store(Request $request): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('attendances')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $status = $payload['status'] === 'present' ? 1 : ($payload['status'] === 'late' ? 2 : 0);
        $tenantDb->table('attendances')->insert([
            'student_id' => $ctx['studentId'],
            'grade_id' => (int) $student->grade_id,
            'class_id' => (int) $student->class_id,
            'section_id' => (int) $student->section_id,
            'attendance_date' => $payload['date'],
            'attendance_status' => $status,
            'notes' => $payload['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('attendances')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $status = $payload['status'] === 'present' ? 1 : ($payload['status'] === 'late' ? 2 : 0);
        $updated = $tenantDb->table('attendances')->where('id', $id)->where('student_id', $ctx['studentId'])->update([
            'attendance_date' => $payload['date'],
            'attendance_status' => $status,
            'notes' => $payload['notes'] ?? null,
            'updated_at' => now(),
        ]);
        if (!$updated) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('attendances')) return response()->json(['message' => 'Module unavailable'], 422);
        $deleted = $tenantDb->table('attendances')->where('id', $id)->where('student_id', $ctx['studentId'])->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }

}
