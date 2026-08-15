<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Lesson;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Lesson */
final class LessonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $collection = (string) config('media.collections.lessons');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'unit_id' => $this->unit_id,
            'notes' => $this->notes,
            'media' => MediaResource::collection($this->getMedia($collection)),
        ];
    }
}
