<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin array<string, mixed> */
final class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $data = is_array($this->resource) ? $this->resource : (array) $this->resource;

        return [
            'id' => (int) ($data['id'] ?? 0),
            'name' => $data['name'] ?? '',
            'phone' => $data['phone'] ?? '-',
            'email' => $data['email'] ?? '',
            'role' => $data['role'] ?? 'admin',
            'status' => $data['status'] ?? 'active',
            'created_at' => $data['created_at'] ?? now()->toDateString(),
        ];
    }
}
