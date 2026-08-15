<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

final class SectionWithLabelsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) ($this->resource['id'] ?? 0),
            'name' => (string) ($this->resource['name'] ?? ''),
            'grade_id' => (int) ($this->resource['grade_id'] ?? 0),
            'class_id' => (int) ($this->resource['class_id'] ?? 0),
            'grade_name' => (string) ($this->resource['grade_name'] ?? ''),
            'class_name' => (string) ($this->resource['class_name'] ?? ''),
        ];
    }
}
