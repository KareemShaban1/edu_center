<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\PortalNotificationService;
use App\Http\Support\ResolvesCenterApiContext;
use App\Models\Parents;
use App\Models\Student;
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
        private readonly PortalNotificationService $portalNotifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($portal = $this->resolvePortalIdentity($request)) {
            $limit = min((int) $request->query('limit', 20), 50);

            return response()->json($this->portalNotifications->list(
                $portal['email'],
                $portal['user_type'],
                $limit,
            ));
        }

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
        if ($portal = $this->resolvePortalIdentity($request)) {
            if (! $this->portalNotifications->markRead($portal['email'], $portal['user_type'], $id)) {
                return response()->json(['message' => 'Not found'], 404);
            }

            return response()->json(['ok' => true]);
        }

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
        if ($portal = $this->resolvePortalIdentity($request)) {
            $this->portalNotifications->markAllRead($portal['email'], $portal['user_type']);

            return response()->json(['ok' => true]);
        }

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
        $payload = $request->validate([
            'subscription' => ['required', 'array'],
            'subscription.endpoint' => ['required', 'string'],
            'subscription.keys' => ['required', 'array'],
            'subscription.keys.p256dh' => ['required', 'string'],
            'subscription.keys.auth' => ['required', 'string'],
        ]);

        if ($portal = $this->resolvePortalIdentity($request)) {
            $updated = $this->portalNotifications->savePushSubscription(
                $portal['email'],
                $portal['user_type'],
                $payload['subscription'],
            );

            return response()->json(['success' => true, 'profiles_updated' => $updated]);
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

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

    /** @return array{email: string, user_type: string}|null */
    private function resolvePortalIdentity(Request $request): ?array
    {
        $bearer = ApiBearerAuth::resolve($request);

        if ($request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false)) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type') ?: ($bearer['user_type'] ?? null);
            if ($email && $userType) {
                return ['email' => (string) $email, 'user_type' => (string) $userType];
            }
        }

        return null;
    }
}
