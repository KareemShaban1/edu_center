<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Connection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Schema;

final class StudentGradesService
{
    public function store(Connection $tenantDb, int $studentId, object $student, array $payload): void
    {
        $table = $payload['source'] === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        $this->ensureModuleAvailable($table);

        $dateCol = $payload['source'] === 'exam' ? 'exam_date' : 'quiz_date';

        $tenantDb->table($table)->insert([
            'student_id' => $studentId,
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
    }

    public function update(Connection $tenantDb, string $source, int $id, int $studentId, array $payload): void
    {
        $this->ensureValidSource($source);

        $table = $source === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        $this->ensureModuleAvailable($table);

        $dateCol = $source === 'exam' ? 'exam_date' : 'quiz_date';

        $updated = $tenantDb->table($table)->where('id', $id)->where('student_id', $studentId)->update([
            $dateCol => $payload['date'],
            'degree' => $payload['degree'] !== null ? (string) $payload['degree'] : '',
            'attendance_status' => $payload['attendance_status'],
            'notes' => $payload['notes'] ?? null,
            'updated_at' => now(),
        ]);

        if (! $updated) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }
    }

    public function destroy(Connection $tenantDb, string $source, int $id, int $studentId): void
    {
        $this->ensureValidSource($source);

        $table = $source === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        $this->ensureModuleAvailable($table);

        $deleted = $tenantDb->table($table)->where('id', $id)->where('student_id', $studentId)->delete();
        if (! $deleted) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }
    }

    private function ensureValidSource(string $source): void
    {
        if (! in_array($source, ['exam', 'quiz'], true)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Invalid source'], 422)
            );
        }
    }

    private function ensureModuleAvailable(string $table): void
    {
        if (! Schema::connection('center')->hasTable($table)) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }
    }
}
