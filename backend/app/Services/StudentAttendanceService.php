<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Connection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Schema;

final class StudentAttendanceService
{
    public function store(Connection $tenantDb, int $studentId, object $student, array $payload): void
    {
        $this->ensureModuleAvailable();

        $status = $payload['status'] === 'present' ? 1 : ($payload['status'] === 'late' ? 2 : 0);

        $tenantDb->table('attendances')->insert([
            'student_id' => $studentId,
            'grade_id' => (int) $student->grade_id,
            'class_id' => (int) $student->class_id,
            'section_id' => (int) $student->section_id,
            'attendance_date' => $payload['date'],
            'attendance_status' => $status,
            'notes' => $payload['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function update(Connection $tenantDb, int $id, int $studentId, array $payload): void
    {
        $this->ensureModuleAvailable();

        $status = $payload['status'] === 'present' ? 1 : ($payload['status'] === 'late' ? 2 : 0);

        $updated = $tenantDb->table('attendances')->where('id', $id)->where('student_id', $studentId)->update([
            'attendance_date' => $payload['date'],
            'attendance_status' => $status,
            'notes' => $payload['notes'] ?? null,
            'updated_at' => now(),
        ]);

        if (! $updated) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }
    }

    public function destroy(Connection $tenantDb, int $id, int $studentId): void
    {
        $this->ensureModuleAvailable();

        $deleted = $tenantDb->table('attendances')->where('id', $id)->where('student_id', $studentId)->delete();
        if (! $deleted) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }
    }

    private function ensureModuleAvailable(): void
    {
        if (! Schema::connection('center')->hasTable('attendances')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }
    }
}
