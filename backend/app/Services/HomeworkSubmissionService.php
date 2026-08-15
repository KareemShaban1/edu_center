<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\StudentHomework;
use Illuminate\Database\Connection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;

final class HomeworkSubmissionService
{
    public function __construct(
        private readonly MediaService $mediaService,
    ) {}

    /**
     * @return array{homework: array<string, mixed>, submissions: \Illuminate\Support\Collection<int, array<string, mixed>>}
     */
    public function listForHomework(Connection $tenantDb, int $homeworkId): array
    {
        $this->ensureHomeworkModuleAvailable();

        $homework = $this->findHomeworkWithLabels($tenantDb, $homeworkId);
        if ($homework === null) {
            throw new HttpResponseException(
                response()->json(['message' => 'Homework not found'], 404)
            );
        }

        $studentsQuery = $tenantDb->table('students')->where('section_id', (int) $homework->section_id);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $studentsQuery->whereNull('deleted_at');
        }
        $students = $studentsQuery->orderBy('name')->get(['id', 'name']);

        $submissionsByStudent = collect();
        if (Schema::connection('center')->hasTable('student_homework')) {
            $submissionsByStudent = StudentHomework::query()
                ->where('homework_id', $homeworkId)
                ->get()
                ->keyBy('student_id');
        }

        $rows = $students->map(function ($student) use ($submissionsByStudent) {
            $submission = $submissionsByStudent->get($student->id);
            if (! $submission) {
                return [
                    'student_id' => (int) $student->id,
                    'student_name' => (string) $student->name,
                    'submission_id' => null,
                    'status' => 'not_submitted',
                    'degree' => '',
                    'rate' => '',
                    'student_notes' => '',
                    'response' => '',
                    'upload_date' => '',
                    'file_url' => null,
                    'file_name' => null,
                    'correction_url' => null,
                    'correction_name' => null,
                ];
            }

            return $submission->toAdminSubmissionArray((string) $student->name);
        })->values();

        return [
            'homework' => $this->formatHomeworkWithLabels($homework),
            'submissions' => $rows,
        ];
    }

    /**
     * @return array{homework: array<string, mixed>, submission: array<string, mixed>}
     */
    public function show(Connection $tenantDb, int $submissionId): array
    {
        $this->ensureStudentHomeworkModuleAvailable();

        $submission = StudentHomework::query()->find($submissionId);
        if (! $submission) {
            throw new HttpResponseException(
                response()->json(['message' => 'Submission not found'], 404)
            );
        }

        $homework = $this->findHomeworkWithLabels($tenantDb, (int) $submission->homework_id);
        if ($homework === null) {
            throw new HttpResponseException(
                response()->json(['message' => 'Homework not found'], 404)
            );
        }

        $student = $tenantDb->table('students')->where('id', $submission->student_id)->first();

        return [
            'homework' => $this->formatHomeworkWithLabels($homework),
            'submission' => $submission->toAdminSubmissionArray((string) ($student->name ?? '')),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{submission: array<string, mixed>}
     */
    public function update(Connection $tenantDb, int $submissionId, array $payload): array
    {
        $this->ensureStudentHomeworkModuleAvailable();

        $submission = StudentHomework::query()->find($submissionId);
        if (! $submission) {
            throw new HttpResponseException(
                response()->json(['message' => 'Submission not found'], 404)
            );
        }

        $submission->status = $payload['status'];
        $submission->degree = $payload['degree'] ?? null;
        $submission->rate = $payload['rate'] ?? null;
        $submission->response = $payload['response'] ?? null;
        $submission->save();

        $student = $tenantDb->table('students')->where('id', $submission->student_id)->first();

        return [
            'submission' => $submission->toAdminSubmissionArray((string) ($student->name ?? '')),
        ];
    }

    /**
     * @return array{submission: array<string, mixed>}
     */
    public function uploadCorrection(Connection $tenantDb, int $submissionId, UploadedFile $file): array
    {
        $this->ensureStudentHomeworkModuleAvailable();

        $submission = StudentHomework::query()->find($submissionId);
        if (! $submission) {
            throw new HttpResponseException(
                response()->json(['message' => 'Submission not found'], 404)
            );
        }

        $this->mediaService->clearCollection($submission, 'correction');
        $this->mediaService->sync($submission, 'correction', [$file]);
        $submission->refresh();

        $student = $tenantDb->table('students')->where('id', $submission->student_id)->first();

        return [
            'submission' => $submission->toAdminSubmissionArray((string) ($student->name ?? '')),
        ];
    }

    private function ensureHomeworkModuleAvailable(): void
    {
        if (! Schema::connection('center')->hasTable('homeworks')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }
    }

    private function ensureStudentHomeworkModuleAvailable(): void
    {
        if (! Schema::connection('center')->hasTable('student_homework')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }
    }

    private function findHomeworkWithLabels(Connection $tenantDb, int $homeworkId): ?object
    {
        return $tenantDb->table('homeworks')
            ->leftJoin('grades', 'homeworks.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'homeworks.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'homeworks.section_id', '=', 'sections.id')
            ->where('homeworks.id', $homeworkId)
            ->first([
                'homeworks.id',
                'homeworks.title',
                'homeworks.content',
                'homeworks.grade_id',
                'homeworks.class_id',
                'homeworks.section_id',
                'homeworks.submit_date as start_date',
                'homeworks.due_date',
                'grades.grade_name',
                'classes.class_name',
                'sections.section_name',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatHomeworkWithLabels(object $homework): array
    {
        return [
            'id' => (int) $homework->id,
            'title' => (string) $homework->title,
            'content' => (string) ($homework->content ?? ''),
            'grade_id' => (int) $homework->grade_id,
            'classroom_id' => (int) $homework->class_id,
            'section_id' => (int) $homework->section_id,
            'grade_name' => (string) ($homework->grade_name ?? ''),
            'class_name' => (string) ($homework->class_name ?? ''),
            'section_name' => (string) ($homework->section_name ?? ''),
            'start_date' => (string) $homework->start_date,
            'due_date' => (string) $homework->due_date,
        ];
    }
}
