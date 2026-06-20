<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Centers\CenterContextManager;
use App\Centers\CenterMembershipService;
use App\Models\Parents;
use App\Models\Platform\Center;
use App\Models\Student;
use Illuminate\Support\Collection;

class PortalNotificationService
{
    public function __construct(
        private readonly CenterContextManager $centerContext,
        private readonly CenterMembershipService $memberships,
    ) {}

    /**
     * @return array{notifications: list<array<string, mixed>>, unread_count: int}
     */
    public function list(string $email, string $userType, int $limit = 20): array
    {
        $items = collect();

        foreach ($this->membershipsFor($email, $userType) as $membership) {
            $center = Center::query()->find($membership['center_id'] ?? null);
            if (! $center) {
                continue;
            }

            $this->centerContext->initialize($center);
            $notifiable = $this->resolveNotifiable($userType, (int) ($membership['user_id'] ?? 0));
            if (! $notifiable) {
                continue;
            }

            foreach ($notifiable->notifications()->latest()->limit($limit)->get() as $notification) {
                $items->push([
                    'id' => $notification->id,
                    'type' => class_basename($notification->type),
                    'data' => array_merge($notification->data ?? [], [
                        'center_id' => $center->id,
                        'center_name' => $center->name,
                    ]),
                    'read_at' => optional($notification->read_at)?->toIso8601String(),
                    'created_at' => $notification->created_at->toIso8601String(),
                ]);
            }
        }

        $this->centerContext->end();

        $sorted = $items->sortByDesc('created_at')->take($limit)->values();
        $unread = $items->filter(fn (array $n) => empty($n['read_at']))->count();

        return [
            'notifications' => $sorted->all(),
            'unread_count' => $unread,
        ];
    }

    public function markRead(string $email, string $userType, string $notificationId): bool
    {
        foreach ($this->membershipsFor($email, $userType) as $membership) {
            $center = Center::query()->find($membership['center_id'] ?? null);
            if (! $center) {
                continue;
            }

            $this->centerContext->initialize($center);
            $notifiable = $this->resolveNotifiable($userType, (int) ($membership['user_id'] ?? 0));
            if (! $notifiable) {
                continue;
            }

            $notification = $notifiable->notifications()->where('id', $notificationId)->first();
            if ($notification) {
                $notification->markAsRead();
                $this->centerContext->end();

                return true;
            }
        }

        $this->centerContext->end();

        return false;
    }

    public function markAllRead(string $email, string $userType): void
    {
        foreach ($this->membershipsFor($email, $userType) as $membership) {
            $center = Center::query()->find($membership['center_id'] ?? null);
            if (! $center) {
                continue;
            }

            $this->centerContext->initialize($center);
            $notifiable = $this->resolveNotifiable($userType, (int) ($membership['user_id'] ?? 0));
            if ($notifiable) {
                $notifiable->unreadNotifications->markAsRead();
            }
        }

        $this->centerContext->end();
    }

    public function savePushSubscription(string $email, string $userType, array $subscription): int
    {
        $encoded = json_encode($subscription);
        $updated = 0;

        foreach ($this->membershipsFor($email, $userType) as $membership) {
            $center = Center::query()->find($membership['center_id'] ?? null);
            if (! $center) {
                continue;
            }

            $this->centerContext->initialize($center);
            $notifiable = $this->resolveNotifiable($userType, (int) ($membership['user_id'] ?? 0));
            if (! $notifiable) {
                continue;
            }

            $notifiable->update(['push_subscription' => $encoded]);
            $updated++;
        }

        $this->centerContext->end();

        return $updated;
    }

    /** @return Collection<int, array<string, mixed>> */
    private function membershipsFor(string $email, string $userType): Collection
    {
        return $this->memberships->listMemberships($email, $userType);
    }

    private function resolveNotifiable(string $userType, int $userId): Student|Parents|null
    {
        if ($userType === Student::class) {
            return Student::query()->find($userId);
        }

        return Parents::query()->find($userId);
    }
}
