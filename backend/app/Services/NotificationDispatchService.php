<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Parents;
use App\Models\Student;
use App\Notifications\ManualNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotificationDispatchService
{
    /**
     * Send a Laravel notification and optionally deliver a web push.
     */
    public function dispatch(Model $notifiable, Notification $notification, bool $sendPush = true): void
    {
        $notifiable->notify($notification);

        if (! $sendPush || empty($notifiable->push_subscription)) {
            return;
        }

        $this->sendWebPush($notifiable, $this->extractPayload($notification, $notifiable));
    }

    /**
     * @param  array{title: string, body: string, url?: string, type?: string, icon?: string}  $data
     */
    public function sendWebPush(Model $notifiable, array $data): void
    {
        if (empty($notifiable->push_subscription)) {
            return;
        }

        $payload = [
            'title' => $data['title'] ?? 'Notification',
            'body' => $data['body'] ?? $data['message'] ?? '',
            'icon' => $data['icon'] ?? config('services.webpush.icon', '/pwa-192.png'),
            'badge' => $data['badge'] ?? config('services.webpush.badge', '/pwa-badge.png'),
            'url' => $data['url'] ?? '/',
            'type' => $data['type'] ?? 'general',
            'unread_count' => $notifiable->unreadNotifications()->count(),
        ];

        try {
            $subscription = json_decode((string) $notifiable->push_subscription, true);
            if (! is_array($subscription) || empty($subscription['endpoint'])) {
                return;
            }

            PushService::sendNotification($subscription, $payload);
        } catch (\Throwable $e) {
            Log::error('Web push failed', [
                'notifiable' => $notifiable->getMorphClass().':'.$notifiable->getKey(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @param  array{
     *   title: string,
     *   body: string,
     *   audience: 'students'|'parents'|'both',
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   parent_ids?: int[],
     *   url?: string|null,
     *   send_push?: bool
     * }  $payload
     * @return array{students: int, parents: int}
     */
    public function sendManual(array $payload): array
    {
        $title = $payload['title'];
        $body = $payload['body'];
        $url = $payload['url'] ?? null;
        $sendPush = $payload['send_push'] ?? true;
        $batchId = Str::uuid()->toString();
        $sectionMeta = $this->resolveSectionMeta(isset($payload['section_id']) ? (int) $payload['section_id'] : null);
        $notification = new ManualNotification($title, $body, $url, array_merge($sectionMeta, [
            'batch_id' => $batchId,
            'audience' => $payload['audience'],
            'send_push' => $sendPush,
        ]));

        $counts = ['students' => 0, 'parents' => 0];

        foreach ($this->resolveRecipients($payload) as $entry) {
            /** @var Model $recipient */
            $recipient = $entry['model'];
            $this->dispatch($recipient, $notification, $sendPush);

            if ($entry['type'] === 'student') {
                $counts['students']++;
            } else {
                $counts['parents']++;
            }
        }

        return $counts;
    }

    /**
     * @param  array{
     *   audience: 'students'|'parents'|'both',
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   parent_ids?: int[]
     * }  $payload
     * @return Collection<int, array{type: 'student'|'parent', model: Model}>
     */
    public function resolveRecipients(array $payload): Collection
    {
        $audience = $payload['audience'];
        $sectionId = isset($payload['section_id']) ? (int) $payload['section_id'] : null;
        $studentIds = collect($payload['student_ids'] ?? [])->filter()->map(fn ($id) => (int) $id)->unique()->values();
        $parentIds = collect($payload['parent_ids'] ?? [])->filter()->map(fn ($id) => (int) $id)->unique()->values();

        $recipients = collect();

        if ($studentIds->isNotEmpty() && in_array($audience, ['students', 'both'], true)) {
            Student::query()->whereIn('id', $studentIds)->get()->each(function (Student $student) use ($recipients) {
                $recipients->push(['type' => 'student', 'model' => $student]);
            });
        }

        if ($parentIds->isNotEmpty() && in_array($audience, ['parents', 'both'], true)) {
            Parents::query()->whereIn('id', $parentIds)->get()->each(function (Parents $parent) use ($recipients) {
                $recipients->push(['type' => 'parent', 'model' => $parent]);
            });
        }

        if ($sectionId && $studentIds->isEmpty() && $parentIds->isEmpty()) {
            if (in_array($audience, ['students', 'both'], true)) {
                Student::query()->where('section_id', $sectionId)->get()->each(function (Student $student) use ($recipients) {
                    $recipients->push(['type' => 'student', 'model' => $student]);
                });
            }

            if (in_array($audience, ['parents', 'both'], true)) {
                $parentIdsFromSection = Student::query()
                    ->where('section_id', $sectionId)
                    ->whereNotNull('parent_id')
                    ->pluck('parent_id')
                    ->unique();

                Parents::query()->whereIn('id', $parentIdsFromSection)->get()->each(function (Parents $parent) use ($recipients) {
                    $recipients->push(['type' => 'parent', 'model' => $parent]);
                });
            }
        }

        return $recipients->unique(fn (array $entry) => $entry['type'].':'.$entry['model']->getKey())->values();
    }

    private function extractPayload(Notification $notification, Model $notifiable): array
    {
        if (method_exists($notification, 'toArray')) {
            $data = $notification->toArray($notifiable);
            if (is_array($data)) {
                return $data;
            }
        }

        return ['title' => 'Notification', 'body' => ''];
    }

    /** @return array{section_id?: int, grade_name?: string, class_name?: string, section_name?: string} */
    private function resolveSectionMeta(?int $sectionId): array
    {
        if (! $sectionId) {
            return [];
        }

        $row = DB::connection('center')
            ->table('sections')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->leftJoin('grades', 'classes.grade_id', '=', 'grades.id')
            ->where('sections.id', $sectionId)
            ->select(
                'sections.id as section_id',
                'sections.section_name as section_name',
                'classes.class_name as class_name',
                'grades.grade_name as grade_name',
            )
            ->first();

        if (! $row) {
            return ['section_id' => $sectionId];
        }

        return [
            'section_id' => (int) $row->section_id,
            'section_name' => (string) ($row->section_name ?? ''),
            'class_name' => (string) ($row->class_name ?? ''),
            'grade_name' => (string) ($row->grade_name ?? ''),
        ];
    }
}
