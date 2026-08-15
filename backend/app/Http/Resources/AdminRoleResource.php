<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin array<string, mixed> */
final class AdminRoleResource extends JsonResource
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
            'guard_name' => $data['guard_name'] ?? 'web',
            'description' => $data['description'] ?? '',
            'permissions' => collect($data['permissions'] ?? [])->values(),
            'users_count' => (int) ($data['users_count'] ?? 0),
        ];
    }
}
