<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class SectionDateHelper
{
    public static function invalidDateResponse(string $date): ?JsonResponse
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['message' => 'Invalid date format'], 422);
        }

        return null;
    }

    public static function findSection(int $sectionId): ?object
    {
        return DB::connection('center')
            ->table('sections')
            ->where('id', $sectionId)
            ->first();
    }

    public static function sectionNotFoundResponse(): JsonResponse
    {
        return response()->json(['message' => 'Section not found'], 404);
    }

    /**
     * @return array{id: int, grade_id: int, class_id: int}
     */
    public static function sectionPayload(object $section): array
    {
        return [
            'id' => (int) $section->id,
            'grade_id' => (int) $section->grade_id,
            'class_id' => (int) $section->class_id,
        ];
    }

    /**
     * @return Collection<int, array{id: int, topic: string, start_at: string, session_type: string}>
     */
    public static function sessionOptions(int $sectionId): Collection
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return collect();
        }

        return DB::connection('center')
            ->table('sessions')
            ->where('section_id', $sectionId)
            ->orderByDesc('start_at')
            ->limit(100)
            ->get(['id', 'topic', 'start_at', 'session_type'])
            ->map(static fn ($session) => [
                'id' => (int) $session->id,
                'topic' => (string) $session->topic,
                'start_at' => (string) $session->start_at,
                'session_type' => (string) ($session->session_type ?? 'online'),
            ])
            ->values();
    }

    public static function validateSessionBelongsToSection(int $sessionId, int $sectionId): bool
    {
        return DB::connection('center')
            ->table('sessions')
            ->where('id', $sessionId)
            ->where('section_id', $sectionId)
            ->exists();
    }
}
