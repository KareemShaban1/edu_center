<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Teacher;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Teacher */
final class TeacherResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'specialization' => $this->subject,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'status' => $this->getAttribute('api_status') ?? 'active',
            'joining_date' => $this->joining_date,
            'class_ids' => $this->getAttribute('class_ids') ?? [],
            'media' => MediaResource::collection($this->getMedia((string) config('media.collections.teachers'))),
        ];
    }
}
