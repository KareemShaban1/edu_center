<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\WhatsappTemplate;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WhatsappTemplate */
final class WhatsappTemplateResource extends JsonResource
{
    /**
     * @return array{id: int, name: string, type: string, content: string, variables: list<string>, created_at: string|null, updated_at: string|null}
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'type' => $this->type ?: 'general',
            'content' => $this->content,
            'variables' => array_values($this->variables ?? []),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
