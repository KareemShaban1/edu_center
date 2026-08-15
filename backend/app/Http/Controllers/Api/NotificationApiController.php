<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminSendNotificationRequest;
use App\Http\Requests\SubscribePushRequest;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\ResolvesCenterApiContext;
use App\Services\NotificationDispatchService;
use App\Services\NotificationInboxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class NotificationApiController extends Controller
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
        private readonly NotificationInboxService $inbox,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($portal = $this->resolvePortalIdentity($request)) {
            $limit = min((int) $request->query('limit', 20), 50);

            return response()->json($this->inbox->listForPortal(
                $portal['email'],
                $portal['user_type'],
                $limit,
            ));
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $limit = min((int) $request->query('limit', 20), 50);

        return response()->json($this->inbox->listForUser($context['authUser'], $limit));
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        if ($portal = $this->resolvePortalIdentity($request)) {
            if (! $this->inbox->markReadForPortal($portal['email'], $portal['user_type'], $id)) {
                return response()->json(['message' => 'Not found'], 404);
            }

            return response()->json(['ok' => true]);
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $this->inbox->markReadForUser($context['authUser'], $id);

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        if ($portal = $this->resolvePortalIdentity($request)) {
            $this->inbox->markAllReadForPortal($portal['email'], $portal['user_type']);

            return response()->json(['ok' => true]);
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $this->inbox->markAllReadForUser($context['authUser']);

        return response()->json(['ok' => true]);
    }

    public function vapidKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => config('services.webpush.vapid.public_key'),
            'icon' => config('services.webpush.icon', '/pwa-192.png'),
            'badge' => config('services.webpush.badge', '/pwa-badge.png'),
        ]);
    }

    public function subscribe(SubscribePushRequest $request): JsonResponse
    {
        $payload = $request->validated();

        if ($portal = $this->resolvePortalIdentity($request)) {
            $updated = $this->inbox->savePushSubscriptionForPortal(
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

        $this->inbox->savePushSubscriptionForUser($context['authUser'], $payload['subscription']);

        return response()->json(['success' => true]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web' || ! Auth::guard('web')->check()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $limit = min((int) $request->query('limit', 100), 200);

        return response()->json($this->inbox->adminHistory($limit));
    }

    public function adminSend(AdminSendNotificationRequest $request): JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web' || ! Auth::guard('web')->check()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        $payload = $request->validated();

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
