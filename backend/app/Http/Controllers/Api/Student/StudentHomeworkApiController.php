<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesStudentApiContext;
use App\Models\StudentHomework;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StudentHomeworkApiController extends Controller
{
    use ResolvesStudentApiContext;
    public function submissions(Request $request): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('student_homework')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'homework_id' => ['required', 'integer', 'exists:center.homeworks,id'],
            'student_notes' => ['nullable', 'string'],
        ]);
        $student = $ctx['student'];
        $homework = $tenantDb->table('homeworks')->where('id', (int) $payload['homework_id'])->first();
        if (!$homework
            || (int) $homework->grade_id !== (int) ($student->grade_id ?? 0)
            || (int) $homework->class_id !== (int) ($student->class_id ?? 0)
            || (int) $homework->section_id !== (int) ($student->section_id ?? 0)) {
            return response()->json(['message' => 'Homework not available for your class'], 422);
        }
        $exists = $tenantDb->table('student_homework')
            ->where('student_id', $ctx['studentId'])
            ->where('homework_id', (int) $payload['homework_id'])
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'Submission already exists. Use update instead.'], 422);
        }
        $uploadedFiles = AdminUploadHelper::validatedFiles($request);
        if ($uploadedFiles === [] && empty($payload['student_notes'])) {
            return response()->json(['message' => 'Upload a file or add notes before submitting.'], 422);
        }
        $dueDate = $homework->due_date ? (string) $homework->due_date : null;
        $status = ($dueDate && now()->toDateString() > $dueDate) ? 'late' : 'submitted';
        $centerId = CenterContext::id()
            ?? ($request->input('center_id') ? (int) $request->input('center_id') : null)
            ?? ($request->session()->get('api_tenant_id') ? (int) $request->session()->get('api_tenant_id') : null);
        $submission = new StudentHomework();
        $submission->student_id = $ctx['studentId'];
        $submission->homework_id = (int) $payload['homework_id'];
        $submission->upload_date_time = now();
        $submission->status = $status;
        $submission->student_notes = $payload['student_notes'] ?? null;
        if ($centerId && Schema::connection('center')->hasColumn('student_homework', 'center_id')) {
            $submission->center_id = $centerId;
        }
        $submission->save();
        foreach ($uploadedFiles as $file) {
            $submission->addMedia($file)->toMediaCollection('homework');
        }
        return response()->json(['ok' => true, 'id' => (int) $submission->id]);
    }

    public function postSubmissions(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        if (!Schema::connection('center')->hasTable('student_homework')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'homework_id' => ['required', 'integer', 'exists:center.homeworks,id'],
            'student_notes' => ['nullable', 'string'],
        ]);
        $submission = StudentHomework::query()
            ->where('id', $id)
            ->where('student_id', $ctx['studentId'])
            ->first();
        if (!$submission) return response()->json(['message' => 'Not found'], 404);
        if ($submission->status === 'approved') {
            return response()->json(['message' => 'Approved submissions cannot be edited'], 422);
        }
        $student = $ctx['student'];
        $homework = DB::connection('center')->table('homeworks')->where('id', (int) $payload['homework_id'])->first();
        if (!$homework
            || (int) $homework->grade_id !== (int) ($student->grade_id ?? 0)
            || (int) $homework->class_id !== (int) ($student->class_id ?? 0)
            || (int) $homework->section_id !== (int) ($student->section_id ?? 0)) {
            return response()->json(['message' => 'Homework not available for your class'], 422);
        }
        $uploadedFiles = AdminUploadHelper::validatedFiles($request);
        $dueDate = $homework->due_date ? (string) $homework->due_date : null;
        $status = in_array($submission->status, ['approved', 'rejected'], true)
            ? $submission->status
            : (($dueDate && now()->toDateString() > $dueDate) ? 'late' : 'submitted');
        $submission->homework_id = (int) $payload['homework_id'];
        $submission->status = $status;
        $submission->student_notes = $payload['student_notes'] ?? null;
        $submission->upload_date_time = now();
        $centerId = CenterContext::id()
            ?? ($request->input('center_id') ? (int) $request->input('center_id') : null)
            ?? ($request->session()->get('api_tenant_id') ? (int) $request->session()->get('api_tenant_id') : null);
        if ($centerId && Schema::connection('center')->hasColumn('student_homework', 'center_id') && empty($submission->center_id)) {
            $submission->center_id = $centerId;
        }
        $submission->save();
        foreach ($uploadedFiles as $file) {
            $submission->addMedia($file)->toMediaCollection('homework');
        }
        return response()->json(['ok' => true]);
    }

    public function updateSubmissions(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        if (!Schema::connection('center')->hasTable('student_homework')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'homework_id' => ['required', 'integer', 'exists:center.homeworks,id'],
            'student_notes' => ['nullable', 'string'],
        ]);
        $submission = StudentHomework::query()
            ->where('id', $id)
            ->where('student_id', $ctx['studentId'])
            ->first();
        if (!$submission) return response()->json(['message' => 'Not found'], 404);
        if ($submission->status === 'approved') {
            return response()->json(['message' => 'Approved submissions cannot be edited'], 422);
        }
        $homework = DB::connection('center')->table('homeworks')->where('id', (int) $payload['homework_id'])->first();
        $dueDate = $homework?->due_date ? (string) $homework->due_date : null;
        $status = in_array($submission->status, ['approved', 'rejected'], true)
            ? $submission->status
            : (($dueDate && now()->toDateString() > $dueDate) ? 'late' : 'submitted');
        $submission->homework_id = (int) $payload['homework_id'];
        $submission->status = $status;
        $submission->student_notes = $payload['student_notes'] ?? null;
        $submission->upload_date_time = now();
        $centerId = CenterContext::id()
            ?? ($request->input('center_id') ? (int) $request->input('center_id') : null)
            ?? ($request->session()->get('api_tenant_id') ? (int) $request->session()->get('api_tenant_id') : null);
        if ($centerId && Schema::connection('center')->hasColumn('student_homework', 'center_id') && empty($submission->center_id)) {
            $submission->center_id = $centerId;
        }
        $submission->save();
        return response()->json(['ok' => true]);
    }

    public function destroySubmissions(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        if (!Schema::connection('center')->hasTable('student_homework')) return response()->json(['message' => 'Module unavailable'], 422);
        $submission = StudentHomework::query()
            ->where('id', $id)
            ->where('student_id', $ctx['studentId'])
            ->first();
        if (!$submission) return response()->json(['message' => 'Not found'], 404);
        if ($submission->status === 'approved') {
            return response()->json(['message' => 'Approved submissions cannot be deleted'], 422);
        }
        $submission->clearMediaCollection('homework');
        $submission->delete();
        return response()->json(['ok' => true]);
    }

}
