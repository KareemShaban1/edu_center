<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Unit;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Unit */
final class UnitResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $collection = (string) config('media.collections.units');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'class_id' => $this->class_id,
            'notes' => $this->notes,
            'media' => MediaResource::collection($this->getMedia($collection)),
        ];
    }
}
