<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

final class StudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $row = is_object($this->resource) ? $this->resource : (object) $this->resource;

        return [
            'id' => (int) $row->id,
            'code' => (string) ($row->code ?? ''),
            'name' => (string) ($row->name ?? ''),
            'email' => (string) ($row->email ?? ''),
            'gender' => (string) ($row->gender ?? ''),
            'status' => (string) ($row->api_status ?? ($row->status ?? 'active')),
            'grade_id' => (int) ($row->grade_id ?? 0),
            'classroom_id' => (int) ($row->class_id ?? $row->classroom_id ?? 0),
            'section_id' => (int) ($row->section_id ?? 0),
            'parent_id' => $row->parent_id ?? null,
            'created_at' => (string) ($row->created_at ?? now()->toDateString()),
        ];
    }
}
