<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\MeetingSeries;
use Carbon\Carbon;

final class MeetingSeriesGenerator
{
    public static function generateForSeries(MeetingSeries $series, Carbon $from, Carbon $to): int
    {
        $weekDays = $series->week_days ?? [];
        if (!is_array($weekDays)) {
            $weekDays = [];
        }

        $startDate = Carbon::parse($series->start_date)->startOfDay();
        $endDate = $series->end_date ? Carbon::parse($series->end_date)->startOfDay() : null;

        $rangeStart = $from->copy()->startOfDay()->max($startDate);
        $rangeEnd = $to->copy()->startOfDay();
        if ($endDate && $rangeEnd->gt($endDate)) {
            $rangeEnd = $endDate;
        }

        if (empty($weekDays) || $rangeStart->gt($rangeEnd)) {
            return 0;
        }

        $generated = 0;
        for ($date = $rangeStart->copy(); $date->lte($rangeEnd); $date->addDay()) {
            // Carbon compatibility: "N" is ISO-8601 day of week (1=Mon ... 7=Sun).
            $isoDow = (int) $date->format('N');
            if (!in_array($isoDow, $weekDays, true)) continue;

            $startAt = Carbon::parse($date->format('Y-m-d').' '.$series->start_time);
            $exists = Meeting::query()
                ->where('series_id', $series->id)
                ->where('start_at', $startAt)
                ->exists();
            if ($exists) continue;

            $generated += self::createOccurrenceFromSeries($series, $startAt);
        }

        return $generated;
    }

    public static function generateForTeacherSeries(string $teacherEmail, Carbon $from, Carbon $to): int
    {
        $series = MeetingSeries::query()->where('created_by', $teacherEmail)->get();
        $total = 0;
        foreach ($series as $s) {
            $total += self::generateForSeries($s, $from, $to);
        }
        return $total;
    }

    private static function createOccurrenceFromSeries(MeetingSeries $series, Carbon $startAt): int
    {
        $provider = $series->provider;

        $base = [
            'series_id' => $series->id,
            'grade_id' => $series->grade_id,
            'class_id' => $series->class_id,
            'section_id' => $series->section_id,
            'created_by' => $series->created_by,
            'topic' => $series->topic,
            'start_at' => $startAt,
            'duration' => (int) $series->duration,
            'provider' => $provider,
            'record_enabled' => $provider === 'livekit' ? (bool) $series->record_enabled : false,
            'external_ref' => $series->external_ref,
            'location' => $series->location,
            'notes' => $series->notes,
        ];

        if ($provider === 'offline') {
            Meeting::create(array_merge($base, [
                'room_slug' => null,
                'join_url' => '#',
                'moderator_url' => null,
                'password' => null,
            ]));
            return 1;
        }

        if ($provider === 'jitsi') {
            $links = MeetingLinkService::forJitsi();
            Meeting::create(array_merge($base, [
                'room_slug' => $links['room_slug'],
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'password' => $series->password,
            ]));
            return 1;
        }

        if ($provider === 'livekit') {
            $slug = MeetingLinkService::generateRoomSlug();
            $links = MeetingLinkService::forLiveKit($slug);
            Meeting::create(array_merge($base, [
                'room_slug' => $slug,
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'password' => $series->password,
            ]));
            return 1;
        }

        // external
        Meeting::create(array_merge($base, [
            'room_slug' => null,
            'join_url' => (string) $series->join_url,
            'moderator_url' => $series->moderator_url,
            'password' => $series->password,
        ]));
        return 1;
    }
}

