<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesCenterApiContext;
use Carbon\Carbon;
use Illuminate\Database\Connection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PersonalProductivityApiController extends Controller
{
    use ResolvesCenterApiContext;

    private const ALLOWED_GUARDS = ['web', 'teacher', 'student'];

    public function todos(Request $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        $items = $this->owned($context, 'personal_todos')
            ->orderByRaw('completed_at IS NOT NULL')
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (object $item) => $this->formatTodo($item))
            ->values();

        return response()->json(['todos' => $items]);
    }

    public function storeTodo(Request $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        $payload = $this->validateTodo($request);
        $id = $context['db']->table('personal_todos')->insertGetId([
            ...$this->ownerColumns($context),
            ...$payload,
            'due_at' => $this->dateTime($payload['due_at'] ?? null),
            'completed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(
            $this->formatTodo($context['db']->table('personal_todos')->find($id)),
            201,
        );
    }

    public function updateTodo(Request $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }
        $this->ownedItemOrFail($context, 'personal_todos', $id);
        $payload = $this->validateTodo($request);

        $this->owned($context, 'personal_todos')->where('id', $id)->update([
            ...$payload,
            'due_at' => $this->dateTime($payload['due_at'] ?? null),
            'updated_at' => now(),
        ]);

        return response()->json(
            $this->formatTodo($context['db']->table('personal_todos')->find($id)),
        );
    }

    public function completeTodo(Request $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }
        $this->ownedItemOrFail($context, 'personal_todos', $id);
        $payload = $request->validate(['completed' => ['required', 'boolean']]);

        $this->owned($context, 'personal_todos')->where('id', $id)->update([
            'completed_at' => $payload['completed'] ? now() : null,
            'updated_at' => now(),
        ]);

        return response()->json(
            $this->formatTodo($context['db']->table('personal_todos')->find($id)),
        );
    }

    public function destroyTodo(Request $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }
        $this->ownedItemOrFail($context, 'personal_todos', $id);
        $this->owned($context, 'personal_todos')->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    public function notes(Request $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        $items = $this->owned($context, 'personal_notes')
            ->orderByDesc('is_pinned')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (object $item) => $this->formatNote($item))
            ->values();

        return response()->json(['notes' => $items]);
    }

    public function storeNote(Request $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }
        $payload = $this->validateNote($request);

        $id = $context['db']->table('personal_notes')->insertGetId([
            ...$this->ownerColumns($context),
            ...$payload,
            'is_pinned' => (bool) ($payload['is_pinned'] ?? false),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(
            $this->formatNote($context['db']->table('personal_notes')->find($id)),
            201,
        );
    }

    public function updateNote(Request $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }
        $this->ownedItemOrFail($context, 'personal_notes', $id);
        $payload = $this->validateNote($request);

        $this->owned($context, 'personal_notes')->where('id', $id)->update([
            ...$payload,
            'is_pinned' => (bool) ($payload['is_pinned'] ?? false),
            'updated_at' => now(),
        ]);

        return response()->json(
            $this->formatNote($context['db']->table('personal_notes')->find($id)),
        );
    }

    public function destroyNote(Request $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }
        $this->ownedItemOrFail($context, 'personal_notes', $id);
        $this->owned($context, 'personal_notes')->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    /** @return array{error: JsonResponse|null, db: Connection|null, center_id: int|null, guard: string|null, owner_id: int|null} */
    private function personalContext(Request $request): array
    {
        $guard = (string) $request->session()->get('api_auth_guard', 'web');
        if (! in_array($guard, self::ALLOWED_GUARDS, true)) {
            return ['error' => response()->json(['message' => 'Forbidden'], 403), 'db' => null, 'center_id' => null, 'guard' => null, 'owner_id' => null];
        }

        $center = $this->centerContext()->resolveFromRequest($request);
        if (! $center) {
            return ['error' => response()->json(['message' => 'Center not found'], 422), 'db' => null, 'center_id' => null, 'guard' => null, 'owner_id' => null];
        }
        $this->ensureCenterInitialized($center);

        $ownerId = Auth::guard($guard)->id() ?? $request->session()->get('api_auth_user_id');
        if (! $ownerId) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401), 'db' => null, 'center_id' => null, 'guard' => null, 'owner_id' => null];
        }

        return [
            'error' => null,
            'db' => $this->centerContext()->centerConnection(),
            'center_id' => (int) $center->id,
            'guard' => $guard,
            'owner_id' => (int) $ownerId,
        ];
    }

    private function owned(array $context, string $table)
    {
        return $context['db']->table($table)
            ->where('center_id', $context['center_id'])
            ->where('owner_guard', $context['guard'])
            ->where('owner_id', $context['owner_id']);
    }

    private function ownedItemOrFail(array $context, string $table, int $id): object
    {
        $item = $this->owned($context, $table)->where('id', $id)->first();
        abort_unless($item, 404, 'Item not found');

        return $item;
    }

    /** @return array{center_id: int, owner_guard: string, owner_id: int} */
    private function ownerColumns(array $context): array
    {
        return [
            'center_id' => $context['center_id'],
            'owner_guard' => $context['guard'],
            'owner_id' => $context['owner_id'],
        ];
    }

    private function validateTodo(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'due_at' => ['nullable', 'date'],
        ]);
    }

    private function validateNote(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:20000'],
            'color' => ['required', Rule::in(['slate', 'amber', 'green', 'blue', 'purple', 'rose'])],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);
    }

    private function dateTime(?string $value): ?Carbon
    {
        return $value ? Carbon::parse($value) : null;
    }

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
