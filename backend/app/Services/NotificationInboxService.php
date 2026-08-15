<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\PortalNotificationService;
use Illuminate\Contracts\Auth\Authenticatable;

final class NotificationInboxService
{
    public function __construct(
        private readonly PortalNotificationService $portalNotifications,
        private readonly CenterNotificationHistoryService $centerNotificationHistory,
    ) {}

    /**
     * @return array{notifications: \Illuminate\Support\Collection, unread_count: int}
     */
    public function listForUser(Authenticatable $user, int $limit): array
    {
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

        return [
            'notifications' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
        ];
    }

    /**
     * @return array{notifications: mixed, unread_count?: int}|array<string, mixed>
     */
    public function listForPortal(string $email, string $userType, int $limit): array
    {
        return $this->portalNotifications->list($email, $userType, $limit);
    }

    public function markReadForUser(Authenticatable $user, string $id): void
    {
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();
    }

    public function markReadForPortal(string $email, string $userType, string $id): bool
    {
        return $this->portalNotifications->markRead($email, $userType, $id);
    }

    public function markAllReadForUser(Authenticatable $user): void
    {
        $user->unreadNotifications->markAsRead();
    }

    public function markAllReadForPortal(string $email, string $userType): void
    {
        $this->portalNotifications->markAllRead($email, $userType);
    }

    public function savePushSubscriptionForUser(Authenticatable $user, array $subscription): void
    {
        $user->update([
            'push_subscription' => json_encode($subscription),
        ]);
    }

    public function savePushSubscriptionForPortal(string $email, string $userType, array $subscription): int
    {
        return $this->portalNotifications->savePushSubscription($email, $userType, $subscription);
    }

    /**
     * @return array<string, mixed>
     */
    public function adminHistory(int $limit): array
    {
        return $this->centerNotificationHistory->list($limit);
    }
}
