<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CenterNotificationHistoryService
{
    /**
     * @return array{notifications: list<array<string, mixed>>, total: int}
     */
    public function list(int $limit = 100): array
    {
        $rows = DB::connection('center')
            ->table('notifications')
            ->select('id', 'type', 'notifiable_type', 'data', 'read_at', 'created_at')
            ->orderByDesc('created_at')
            ->limit(2000)
            ->get();

        /** @var array<string, array<string, mixed>> $groups */
        $groups = [];

        foreach ($rows as $row) {
            /** @var array<string, mixed> $data */
            $data = json_decode((string) $row->data, true) ?: [];
            $batchId = isset($data['batch_id']) ? (string) $data['batch_id'] : null;
            $groupKey = $batchId ?: $this->fallbackGroupKey((string) $row->type, $data, (string) $row->created_at);

            if (! isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'id' => $batchId ?: $groupKey,
                    'notification_type' => class_basename((string) $row->type),
                    'channel_type' => (string) ($data['type'] ?? $this->inferChannelType((string) $row->type)),
                    'title' => (string) ($data['title'] ?? ''),
                    'body' => (string) ($data['body'] ?? $data['message'] ?? ''),
                    'url' => isset($data['url']) ? (string) $data['url'] : null,
                    'audience' => isset($data['audience']) ? (string) $data['audience'] : null,
                    'section_id' => isset($data['section_id']) ? (int) $data['section_id'] : null,
                    'grade_name' => isset($data['grade_name']) ? (string) $data['grade_name'] : null,
                    'class_name' => isset($data['class_name']) ? (string) $data['class_name'] : null,
                    'section_name' => isset($data['section_name']) ? (string) $data['section_name'] : null,
                    'send_push' => array_key_exists('send_push', $data) ? (bool) $data['send_push'] : null,
                    'source' => isset($data['source']) ? (string) $data['source'] : null,
                    'sent_at' => Carbon::parse((string) $row->created_at)->toIso8601String(),
                    'recipients_count' => 0,
                    'students_count' => 0,
                    'parents_count' => 0,
                    'read_count' => 0,
                ];
            }

            $groups[$groupKey]['recipients_count']++;
            if (str_contains((string) $row->notifiable_type, 'Student')) {
                $groups[$groupKey]['students_count']++;
            } elseif (str_contains((string) $row->notifiable_type, 'Parent')) {
                $groups[$groupKey]['parents_count']++;
            }

            if ($row->read_at) {
                $groups[$groupKey]['read_count']++;
            }
        }

        /** @var Collection<int, array<string, mixed>> $items */
        $items = collect($groups)
            ->sortByDesc(fn (array $item) => $item['sent_at'])
            ->values()
            ->take($limit);

        return [
            'notifications' => $items->all(),
            'total' => count($groups),
        ];
    }

    /** @param array<string, mixed> $data */
    private function fallbackGroupKey(string $type, array $data, string $createdAt): string
    {
        $minute = Carbon::parse($createdAt)->format('Y-m-d H:i');
        $title = (string) ($data['title'] ?? '');
        $body = (string) ($data['body'] ?? $data['message'] ?? '');

        return md5($type.'|'.$title.'|'.$body.'|'.$minute);
    }

    private function inferChannelType(string $type): string
    {
        return match (class_basename($type)) {
            'ManualNotification' => 'manual',
            'AnnouncementNotification' => 'announcement',
            'StudentAttendanceNotification', 'ParentAttendanceNotification' => 'attendance',
            default => 'general',
        };
    }
}
