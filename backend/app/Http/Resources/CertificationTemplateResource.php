<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CertificationTemplate;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CertificationTemplate */
final class CertificationTemplateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'variables' => array_values($this->variables ?? []),
            'design_id' => $this->design_id,
            'design' => $this->design,
            'is_system' => (bool) $this->is_system,
            'background_url' => $this->getFirstMediaUrl('certification_background') ?: null,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
