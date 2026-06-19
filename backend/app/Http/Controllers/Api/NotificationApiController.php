<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesCenterApiContext;
use App\Services\NotificationDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationApiController extends Controller
{
    use ResolvesCenterApiContext;

    private const TENANT_GUARDS = ['web', 'teacher', 'parent', 'student'];

    private const ROLE_MAP = [
        'web' => 'admin',
        'teacher' => 'teacher',
        'parent' => 'parent',
        'student' => 'student',
        'platform_admin' => 'super_admin',
    ];

    public function __construct(
        private readonly NotificationDispatchService $dispatcher,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $user = $context['authUser'];
        $limit = min((int) $request->query('limit', 20), 50);

        $notifications = $user->notifications()
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => class_basename($n->type),
                'data' => $n->data,
                'read_at' => optional($n->read_at)?->toIso8601String(),
                'created_at' => $n->created_at->toIso8601String(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $notification = $context['authUser']->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $context['authUser']->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function vapidKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => config('services.webpush.vapid.public_key'),
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $payload = $request->validate([
            'subscription' => ['required', 'array'],
            'subscription.endpoint' => ['required', 'string'],
            'subscription.keys' => ['required', 'array'],
            'subscription.keys.p256dh' => ['required', 'string'],
            'subscription.keys.auth' => ['required', 'string'],
        ]);

        $user = $context['authUser'];
        $user->update([
            'push_subscription' => json_encode($payload['subscription']),
        ]);

        return response()->json(['success' => true]);
    }

    public function adminSend(Request $request): JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web' || ! Auth::guard('web')->check()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:2000'],
            'audience' => ['required', 'in:students,parents,both'],
            'section_id' => ['nullable', 'integer', 'exists:center.sections,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:center.students,id'],
            'parent_ids' => ['nullable', 'array'],
            'parent_ids.*' => ['integer', 'exists:center.parents,id'],
            'url' => ['nullable', 'string', 'max:500'],
            'send_push' => ['nullable', 'boolean'],
        ]);

        if (
            empty($payload['section_id'])
            && empty($payload['student_ids'])
            && empty($payload['parent_ids'])
        ) {
            return response()->json([
                'message' => 'Select a section or specific recipients.',
            ], 422);
        }

        $counts = $this->dispatcher->sendManual([
            'title' => $payload['title'],
            'body' => $payload['body'],
            'audience' => $payload['audience'],
            'section_id' => $payload['section_id'] ?? null,
            'student_ids' => $payload['student_ids'] ?? [],
            'parent_ids' => $payload['parent_ids'] ?? [],
            'url' => $payload['url'] ?? null,
            'send_push' => $payload['send_push'] ?? true,
        ]);

        return response()->json([
            'message' => 'Notifications sent',
            'sent' => $counts,
        ]);
    }
}
