<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Classes;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Classes */
final class ClassResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->class_name,
            'grade_id' => (int) $this->grade_id,
            'notes' => $this->resource->getAttributes()['notes'] ?? null,
        ];
    }
}
