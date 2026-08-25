<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $title
 * @property-read string|null $content
 * @property-read int $grade_id
 * @property-read int $classroom_id
 * @property-read int $section_id
 * @property-read string|null $start_date
 * @property-read string|null $due_date
 * @property-read string|null $final_degree
 * @property-read string|null $grade_name
 * @property-read string|null $class_name
 * @property-read string|null $section_name
 */
final class HomeworkResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $data = [
            'id' => (int) $this->id,
            'title' => (string) $this->title,
            'content' => (string) ($this->content ?? ''),
            'grade_id' => (int) $this->grade_id,
            'classroom_id' => (int) $this->classroom_id,
            'section_id' => (int) $this->section_id,
            'start_date' => (string) ($this->start_date ?? ''),
            'due_date' => (string) ($this->due_date ?? ''),
            'final_degree' => (string) ($this->final_degree ?? ''),
        ];

        if (isset($this->grade_name)) {
            $data['grade_name'] = (string) ($this->grade_name ?? '');
        }
        if (isset($this->class_name)) {
            $data['class_name'] = (string) ($this->class_name ?? '');
        }
        if (isset($this->section_name)) {
            $data['section_name'] = (string) ($this->section_name ?? '');
        }

        return $data;
    }
}
