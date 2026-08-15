<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Grade;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Grade */
final class GradeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->grade_name,
            'notes' => $this->notes,
        ];
    }
}
