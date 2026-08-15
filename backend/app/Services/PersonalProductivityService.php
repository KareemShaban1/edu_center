<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Database\Connection;

final class PersonalProductivityService
{
    /**
     * @return list<array<string, mixed>>
     */
    public function listTodos(Connection $db, int $centerId, string $guard, int $ownerId): array
    {
        return $this->owned($db, $centerId, $guard, $ownerId, 'personal_todos')
            ->orderByRaw('completed_at IS NOT NULL')
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (object $item) => $this->formatTodo($item))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function createTodo(Connection $db, int $centerId, string $guard, int $ownerId, array $payload): array
    {
        $id = $db->table('personal_todos')->insertGetId([
            'center_id' => $centerId,
            'owner_guard' => $guard,
            'owner_id' => $ownerId,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'priority' => $payload['priority'],
            'due_at' => $this->dateTime($payload['due_at'] ?? null),
            'completed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->formatTodo($db->table('personal_todos')->find($id));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function updateTodo(Connection $db, int $centerId, string $guard, int $ownerId, int $id, array $payload): array
    {
        $this->ownedItemOrFail($db, $centerId, $guard, $ownerId, 'personal_todos', $id);

        $this->owned($db, $centerId, $guard, $ownerId, 'personal_todos')->where('id', $id)->update([
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'priority' => $payload['priority'],
            'due_at' => $this->dateTime($payload['due_at'] ?? null),
            'updated_at' => now(),
        ]);

        return $this->formatTodo($db->table('personal_todos')->find($id));
    }

    /**
     * @return array<string, mixed>
     */
    public function completeTodo(Connection $db, int $centerId, string $guard, int $ownerId, int $id, bool $completed): array
    {
        $this->ownedItemOrFail($db, $centerId, $guard, $ownerId, 'personal_todos', $id);

        $this->owned($db, $centerId, $guard, $ownerId, 'personal_todos')->where('id', $id)->update([
            'completed_at' => $completed ? now() : null,
            'updated_at' => now(),
        ]);

        return $this->formatTodo($db->table('personal_todos')->find($id));
    }

    public function deleteTodo(Connection $db, int $centerId, string $guard, int $ownerId, int $id): void
    {
        $this->ownedItemOrFail($db, $centerId, $guard, $ownerId, 'personal_todos', $id);
        $this->owned($db, $centerId, $guard, $ownerId, 'personal_todos')->where('id', $id)->delete();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listNotes(Connection $db, int $centerId, string $guard, int $ownerId): array
    {
        return $this->owned($db, $centerId, $guard, $ownerId, 'personal_notes')
            ->orderByDesc('is_pinned')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (object $item) => $this->formatNote($item))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function createNote(Connection $db, int $centerId, string $guard, int $ownerId, array $payload): array
    {
        $id = $db->table('personal_notes')->insertGetId([
            'center_id' => $centerId,
            'owner_guard' => $guard,
            'owner_id' => $ownerId,
            'title' => $payload['title'],
            'content' => $payload['content'],
            'color' => $payload['color'],
            'is_pinned' => (bool) ($payload['is_pinned'] ?? false),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->formatNote($db->table('personal_notes')->find($id));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function updateNote(Connection $db, int $centerId, string $guard, int $ownerId, int $id, array $payload): array
    {
        $this->ownedItemOrFail($db, $centerId, $guard, $ownerId, 'personal_notes', $id);

        $this->owned($db, $centerId, $guard, $ownerId, 'personal_notes')->where('id', $id)->update([
            'title' => $payload['title'],
            'content' => $payload['content'],
            'color' => $payload['color'],
            'is_pinned' => (bool) ($payload['is_pinned'] ?? false),
            'updated_at' => now(),
        ]);

        return $this->formatNote($db->table('personal_notes')->find($id));
    }

    public function deleteNote(Connection $db, int $centerId, string $guard, int $ownerId, int $id): void
    {
        $this->ownedItemOrFail($db, $centerId, $guard, $ownerId, 'personal_notes', $id);
        $this->owned($db, $centerId, $guard, $ownerId, 'personal_notes')->where('id', $id)->delete();
    }

    private function owned(Connection $db, int $centerId, string $guard, int $ownerId, string $table)
    {
        return $db->table($table)
            ->where('center_id', $centerId)
            ->where('owner_guard', $guard)
            ->where('owner_id', $ownerId);
    }

    private function ownedItemOrFail(Connection $db, int $centerId, string $guard, int $ownerId, string $table, int $id): object
    {
        $item = $this->owned($db, $centerId, $guard, $ownerId, $table)->where('id', $id)->first();
        abort_unless($item, 404, 'Item not found');

        return $item;
    }

    private function dateTime(?string $value): ?Carbon
    {
        return $value ? Carbon::parse($value) : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTodo(object $item): array
    {
        return [
            'id' => (int) $item->id,
            'title' => $item->title,
            'description' => $item->description,
            'priority' => $item->priority,
            'due_at' => $item->due_at ? Carbon::parse($item->due_at)->toIso8601String() : null,
            'completed_at' => $item->completed_at ? Carbon::parse($item->completed_at)->toIso8601String() : null,
            'created_at' => Carbon::parse($item->created_at)->toIso8601String(),
            'updated_at' => Carbon::parse($item->updated_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatNote(object $item): array
    {
        return [
            'id' => (int) $item->id,
            'title' => $item->title,
            'content' => $item->content,
            'color' => $item->color,
            'is_pinned' => (bool) $item->is_pinned,
            'created_at' => Carbon::parse($item->created_at)->toIso8601String(),
            'updated_at' => Carbon::parse($item->updated_at)->toIso8601String(),
        ];
    }
}
