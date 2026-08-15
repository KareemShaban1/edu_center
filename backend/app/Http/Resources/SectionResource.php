<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

final class SectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) ($this->resource['id'] ?? $this->id ?? 0),
            'name' => (string) ($this->resource['name'] ?? $this->name ?? ''),
            'grade_id' => (int) ($this->resource['grade_id'] ?? $this->grade_id ?? 0),
            'class_id' => (int) ($this->resource['class_id'] ?? $this->class_id ?? 0),
            'teacher_id' => $this->resource['teacher_id'] ?? $this->teacher_id ?? null,
            'week_days' => $this->resource['week_days'] ?? $this->week_days ?? [],
        ];
    }
}
