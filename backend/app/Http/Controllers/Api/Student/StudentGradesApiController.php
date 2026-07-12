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

class StudentGradesApiController extends Controller
{
    use ResolvesStudentApiContext;
    public function store(Request $request): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        $payload = $request->validate([
            'source' => ['required', 'in:exam,quiz'],
            'date' => ['required', 'date'],
            'degree' => ['nullable', 'numeric'],
            'attendance_status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $table = $payload['source'] === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        if (!Schema::connection('center')->hasTable($table)) return response()->json(['message' => 'Module unavailable'], 422);
        $dateCol = $payload['source'] === 'exam' ? 'exam_date' : 'quiz_date';
        $tenantDb->table($table)->insert([
            'student_id' => $ctx['studentId'],
            'grade_id' => (int) $student->grade_id,
            'class_id' => (int) $student->class_id,
            'section_id' => (int) $student->section_id,
            'attendance_status' => $payload['attendance_status'],
            $dateCol => $payload['date'],
            'degree' => $payload['degree'] !== null ? (string) $payload['degree'] : '',
            'notes' => $payload['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

    public function update(Request $request, string $source, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!in_array($source, ['exam', 'quiz'], true)) return response()->json(['message' => 'Invalid source'], 422);
        $payload = $request->validate([
            'date' => ['required', 'date'],
            'degree' => ['nullable', 'numeric'],
            'attendance_status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $table = $source === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        if (!Schema::connection('center')->hasTable($table)) return response()->json(['message' => 'Module unavailable'], 422);
        $dateCol = $source === 'exam' ? 'exam_date' : 'quiz_date';
        $updated = $tenantDb->table($table)->where('id', $id)->where('student_id', $ctx['studentId'])->update([
            $dateCol => $payload['date'],
            'degree' => $payload['degree'] !== null ? (string) $payload['degree'] : '',
            'attendance_status' => $payload['attendance_status'],
            'notes' => $payload['notes'] ?? null,
            'updated_at' => now(),
        ]);
        if (!$updated) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, string $source, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!in_array($source, ['exam', 'quiz'], true)) return response()->json(['message' => 'Invalid source'], 422);
        $table = $source === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        if (!Schema::connection('center')->hasTable($table)) return response()->json(['message' => 'Module unavailable'], 422);
        $deleted = $tenantDb->table($table)->where('id', $id)->where('student_id', $ctx['studentId'])->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }

}
