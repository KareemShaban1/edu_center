<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Announcement;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/** @mixin Announcement */
final class AnnouncementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $collection = (string) config('media.collections.announcements');

        return [
            'id' => (int) $this->id,
            'grade_id' => (int) $this->grade_id,
            'class_id' => (int) $this->class_id,
            'section_id' => (int) $this->section_id,
            'title' => $this->title,
            'content' => $this->body,
            'time' => $this->time ? Carbon::parse($this->time)->format('Y-m-d\TH:i') : null,
            'type' => $this->announcement_type ?: 'others',
            'grade_name' => $this->grade?->grade_name ?: '',
            'class_name' => $this->class?->class_name ?: '',
            'section_name' => $this->section?->section_name ?: '',
            'created_at' => optional($this->created_at)->format('Y-m-d') ?? now()->toDateString(),
            'media' => MediaResource::collection($this->getMedia($collection))->resolve(),
        ];
    }
}
