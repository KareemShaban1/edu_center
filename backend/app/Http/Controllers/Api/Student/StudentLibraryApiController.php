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

class StudentLibraryApiController extends Controller
{
    use ResolvesStudentApiContext;
    public function store(Request $request): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('library')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
        ]);
        $tenantDb->table('library')->insert([
            'title' => $payload['title'],
            'grade_id' => (int) $student->grade_id,
            'class_id' => (int) $student->class_id,
            'section_id' => (int) $student->section_id,
            'type' => $payload['type'],
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
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('library')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
        ]);
        $updated = $tenantDb->table('library')
            ->where('id', $id)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->whereNull('deleted_at')
            ->update([
                'title' => $payload['title'],
                'type' => $payload['type'],
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
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('library')) return response()->json(['message' => 'Module unavailable'], 422);
        $deleted = $tenantDb->table('library')
            ->where('id', $id)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'updated_at' => now()]);
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }

}
