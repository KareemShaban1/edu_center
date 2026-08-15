<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\StudentCertification;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudentCertification */
final class StudentCertificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'template_id' => $this->template_id ? (int) $this->template_id : null,
            'template_title' => $this->template?->title,
            'student_id' => (int) $this->student_id,
            'student_name' => $this->student?->name,
            'section_id' => $this->section_id ? (int) $this->section_id : null,
            'title' => $this->title,
            'content' => $this->content,
            'variables' => $this->variables ?? [],
            'design' => $this->design,
            'design_id' => $this->template?->design_id,
            'context' => $this->context,
            'context_date' => optional($this->context_date)?->toDateString(),
            'issued_at' => optional($this->issued_at)?->toIso8601String(),
            'is_custom' => (bool) $this->is_custom,
        ];
    }
}
