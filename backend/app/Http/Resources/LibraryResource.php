<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Library;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Library */
final class LibraryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $collection = (string) config('media.collections.library');

        return [
            'id' => (int) $this->id,
            'title' => $this->title,
            'grade_id' => (int) $this->grade_id,
            'class_id' => (int) $this->class_id,
            'section_id' => (int) $this->section_id,
            'type' => $this->type ?: 'resource',
            'notes' => $this->notes ?? '',
            'grade_name' => $this->grade?->grade_name ?: '',
            'class_name' => $this->class?->class_name ?: '',
            'section_name' => $this->section?->section_name ?: '',
            'created_at' => optional($this->created_at)->format('Y-m-d') ?? now()->toDateString(),
            'media' => MediaResource::collection($this->getMedia($collection)),
        ];
    }
}
