<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterContext;
use App\Models\StudentHomework;
use Illuminate\Database\Connection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class StudentHomeworkService
{
    /**
     * @param  list<UploadedFile>  $uploadedFiles
     * @return array{id: int}
     */
    public function createSubmission(
        Connection $tenantDb,
        int $studentId,
        object $student,
        array $payload,
        array $uploadedFiles,
        ?int $centerId,
    ): array {
        $this->ensureModuleAvailable();

        $homework = $this->resolveHomeworkForStudent($tenantDb, (int) $payload['homework_id'], $student);

        $exists = $tenantDb->table('student_homework')
            ->where('student_id', $studentId)
            ->where('homework_id', (int) $payload['homework_id'])
            ->exists();
        if ($exists) {
            throw new HttpResponseException(
                response()->json(['message' => 'Submission already exists. Use update instead.'], 422)
            );
        }

        if ($uploadedFiles === [] && empty($payload['student_notes'])) {
            throw new HttpResponseException(
                response()->json(['message' => 'Upload a file or add notes before submitting.'], 422)
            );
        }

        $dueDate = $homework->due_date ? (string) $homework->due_date : null;
        $status = ($dueDate && now()->toDateString() > $dueDate) ? 'late' : 'submitted';

        $submission = new StudentHomework();
        $submission->student_id = $studentId;
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

        return ['id' => (int) $submission->id];
    }

    /**
     * @param  list<UploadedFile>  $uploadedFiles
     */
    public function updateSubmissionWithMedia(
        int $id,
        int $studentId,
        object $student,
        array $payload,
        array $uploadedFiles,
        ?int $centerId,
    ): void {
        $this->ensureModuleAvailable();

        $submission = $this->findOwnedSubmission($id, $studentId);
        $this->ensureEditable($submission);

        $homework = $this->resolveHomeworkForStudent(
            DB::connection('center'),
            (int) $payload['homework_id'],
            $student,
        );

        $dueDate = $homework->due_date ? (string) $homework->due_date : null;
        $status = in_array($submission->status, ['approved', 'rejected'], true)
            ? $submission->status
            : (($dueDate && now()->toDateString() > $dueDate) ? 'late' : 'submitted');

        $submission->homework_id = (int) $payload['homework_id'];
        $submission->status = $status;
        $submission->student_notes = $payload['student_notes'] ?? null;
        $submission->upload_date_time = now();
        if ($centerId && Schema::connection('center')->hasColumn('student_homework', 'center_id') && empty($submission->center_id)) {
            $submission->center_id = $centerId;
        }
        $submission->save();

        foreach ($uploadedFiles as $file) {
            $submission->addMedia($file)->toMediaCollection('homework');
        }
    }

    public function updateSubmission(
        int $id,
        int $studentId,
        array $payload,
        ?int $centerId,
    ): void {
        $this->ensureModuleAvailable();

        $submission = $this->findOwnedSubmission($id, $studentId);
        $this->ensureEditable($submission);

        $homework = DB::connection('center')->table('homeworks')->where('id', (int) $payload['homework_id'])->first();
        $dueDate = $homework?->due_date ? (string) $homework->due_date : null;
        $status = in_array($submission->status, ['approved', 'rejected'], true)
            ? $submission->status
            : (($dueDate && now()->toDateString() > $dueDate) ? 'late' : 'submitted');

        $submission->homework_id = (int) $payload['homework_id'];
        $submission->status = $status;
        $submission->student_notes = $payload['student_notes'] ?? null;
        $submission->upload_date_time = now();
        if ($centerId && Schema::connection('center')->hasColumn('student_homework', 'center_id') && empty($submission->center_id)) {
            $submission->center_id = $centerId;
        }
        $submission->save();
    }

    public function deleteSubmission(int $id, int $studentId): void
    {
        $this->ensureModuleAvailable();

        $submission = $this->findOwnedSubmission($id, $studentId);
        if ($submission->status === 'approved') {
            throw new HttpResponseException(
                response()->json(['message' => 'Approved submissions cannot be deleted'], 422)
            );
        }

        $submission->clearMediaCollection('homework');
        $submission->delete();
    }

    public static function resolveCenterId(?int $requestCenterId, ?int $sessionTenantId): ?int
    {
        return CenterContext::id()
            ?? ($requestCenterId ?: null)
            ?? ($sessionTenantId ?: null);
    }

    private function ensureModuleAvailable(): void
    {
        if (! Schema::connection('center')->hasTable('student_homework')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }
    }

    private function findOwnedSubmission(int $id, int $studentId): StudentHomework
    {
        $submission = StudentHomework::query()
            ->where('id', $id)
            ->where('student_id', $studentId)
            ->first();

        if (! $submission) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }

        return $submission;
    }

    private function ensureEditable(StudentHomework $submission): void
    {
        if ($submission->status === 'approved') {
            throw new HttpResponseException(
                response()->json(['message' => 'Approved submissions cannot be edited'], 422)
            );
        }
    }

    private function resolveHomeworkForStudent(Connection $tenantDb, int $homeworkId, object $student): object
    {
        $homework = $tenantDb->table('homeworks')->where('id', $homeworkId)->first();
        if (! $homework
            || (int) $homework->grade_id !== (int) ($student->grade_id ?? 0)
            || (int) $homework->class_id !== (int) ($student->class_id ?? 0)
            || (int) $homework->section_id !== (int) ($student->section_id ?? 0)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Homework not available for your class'], 422)
            );
        }

        return $homework;
    }
}
