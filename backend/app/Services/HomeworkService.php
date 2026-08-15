<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

final class HomeworkService
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function create(array $payload): array
    {
        $id = DB::connection('center')->table('homeworks')->insertGetId([
            'title' => $payload['title'],
            'content' => $payload['content'] ?? '',
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'submit_date' => $payload['start_date'],
            'due_date' => $payload['due_date'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->formatPayloadResponse($id, $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function update(int $id, array $payload): array
    {
        $exists = DB::connection('center')->table('homeworks')->where('id', $id)->exists();
        if (! $exists) {
            throw new HttpResponseException(
                response()->json(['message' => 'Homework not found'], 404)
            );
        }

        DB::connection('center')->table('homeworks')->where('id', $id)->update([
            'title' => $payload['title'],
            'content' => $payload['content'] ?? '',
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'submit_date' => $payload['start_date'],
            'due_date' => $payload['due_date'],
            'updated_at' => now(),
        ]);

        return $this->formatPayloadResponse($id, $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function formatPayloadResponse(int $id, array $payload): array
    {
        return [
            'id' => $id,
            'title' => $payload['title'],
            'content' => $payload['content'] ?? '',
            'grade_id' => $payload['grade_id'],
            'classroom_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'start_date' => $payload['start_date'],
            'due_date' => $payload['due_date'],
        ];
    }
}
