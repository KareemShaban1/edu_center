<?php

namespace App\Services;

use Illuminate\Support\Str;

final class MeetingLinkService
{
    public static function generateRoomSlug(): string
    {
        return 'edu-'.Str::lower(Str::random(16));
    }

    /**
     * @return array{join_url: string, moderator_url: string, room_slug: string}
     */
    public static function forJitsi(?string $roomSlug = null): array
    {
        $slug = $roomSlug ?: self::generateRoomSlug();
        $base = config('meetings.jitsi.base_url');
        $path = rawurlencode($slug);
        $join = $base.'/'.$path.'#config.prejoinPageEnabled=false';
        $mod = $base.'/'.$path.'#config.prejoinPageEnabled=false&userInfo.displayName='.rawurlencode('Host');

        return [
            'room_slug' => $slug,
            'join_url' => $join,
            'moderator_url' => $mod,
        ];
    }

    /**
     * @return array{join_url: string, moderator_url: string, room_slug: string}
     */
    public static function forLiveKit(string $roomSlug): array
    {
        $url = rtrim((string) config('meetings.livekit.url'), '/');

        return [
            'room_slug' => $roomSlug,
            'join_url' => $url,
            'moderator_url' => $url,
        ];
    }
}
