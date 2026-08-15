<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Connection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Schema;

final class StudentLibraryService
{
    public function store(Connection $tenantDb, object $student, array $payload): void
    {
        $this->ensureModuleAvailable();

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
    }

    public function update(Connection $tenantDb, int $id, object $student, array $payload): void
    {
        $this->ensureModuleAvailable();

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

        if (! $updated) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }
    }

    public function destroy(Connection $tenantDb, int $id, object $student): void
    {
        $this->ensureModuleAvailable();

        $deleted = $tenantDb->table('library')
            ->where('id', $id)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'updated_at' => now()]);

        if (! $deleted) {
            throw new HttpResponseException(
                response()->json(['message' => 'Not found'], 404)
            );
        }
    }

    private function ensureModuleAvailable(): void
    {
        if (! Schema::connection('center')->hasTable('library')) {
            throw new HttpResponseException(
                response()->json(['message' => 'Module unavailable'], 422)
            );
        }
    }
}
