<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteTodoRequest;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\StoreTodoRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Http\Requests\UpdateTodoRequest;
use App\Http\Support\ResolvesCenterApiContext;
use App\Services\PersonalProductivityService;
use Illuminate\Database\Connection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class PersonalProductivityApiController extends Controller
{
    use ResolvesCenterApiContext;

    private const ALLOWED_GUARDS = ['web', 'teacher', 'student'];

    public function __construct(
        private readonly PersonalProductivityService $productivityService,
    ) {}

    public function todos(Request $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        return response()->json([
            'todos' => $this->productivityService->listTodos(
                $context['db'],
                $context['center_id'],
                $context['guard'],
                $context['owner_id'],
            ),
        ]);
    }

    public function storeTodo(StoreTodoRequest $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        return response()->json(
            $this->productivityService->createTodo(
                $context['db'],
                $context['center_id'],
                $context['guard'],
                $context['owner_id'],
                $request->validated(),
            ),
            201,
        );
    }

    public function updateTodo(UpdateTodoRequest $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        return response()->json(
            $this->productivityService->updateTodo(
                $context['db'],
                $context['center_id'],
                $context['guard'],
                $context['owner_id'],
                $id,
                $request->validated(),
            ),
        );
    }

    public function completeTodo(CompleteTodoRequest $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        return response()->json(
            $this->productivityService->completeTodo(
                $context['db'],
                $context['center_id'],
                $context['guard'],
                $context['owner_id'],
                $id,
                (bool) $request->validated()['completed'],
            ),
        );
    }

    public function destroyTodo(Request $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        $this->productivityService->deleteTodo(
            $context['db'],
            $context['center_id'],
            $context['guard'],
            $context['owner_id'],
            $id,
        );

        return response()->json(['ok' => true]);
    }

    public function notes(Request $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        return response()->json([
            'notes' => $this->productivityService->listNotes(
                $context['db'],
                $context['center_id'],
                $context['guard'],
                $context['owner_id'],
            ),
        ]);
    }

    public function storeNote(StoreNoteRequest $request): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        return response()->json(
            $this->productivityService->createNote(
                $context['db'],
                $context['center_id'],
                $context['guard'],
                $context['owner_id'],
                $request->validated(),
            ),
            201,
        );
    }

    public function updateNote(UpdateNoteRequest $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        return response()->json(
            $this->productivityService->updateNote(
                $context['db'],
                $context['center_id'],
                $context['guard'],
                $context['owner_id'],
                $id,
                $request->validated(),
            ),
        );
    }

    public function destroyNote(Request $request, int $id): JsonResponse
    {
        $context = $this->personalContext($request);
        if ($context['error']) {
            return $context['error'];
        }

        $this->productivityService->deleteNote(
            $context['db'],
            $context['center_id'],
            $context['guard'],
            $context['owner_id'],
            $id,
        );

        return response()->json(['ok' => true]);
    }

    /**
     * @return array{
     *   error: JsonResponse|null,
     *   db: Connection|null,
     *   center_id: int|null,
     *   guard: string|null,
     *   owner_id: int|null
     * }
     */
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
}
