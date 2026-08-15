<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Parents;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Parents */
final class ParentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->parent_name,
            'email' => $this->email,
            'phone' => $this->parent_phone,
            'job_title' => $this->parent_job,
            'address' => $this->parent_address,
            'status' => $this->getAttribute('api_status') ?? 'active',
        ];
    }
}
