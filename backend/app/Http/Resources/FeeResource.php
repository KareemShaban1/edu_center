<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Fee;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** @mixin Fee */
final class FeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => (int) $this->id,
            'title' => $this->title,
            'amount' => (float) $this->amount,
            'grade_id' => (int) $this->grade_id,
            'classroom_id' => (int) $this->class_id,
            'section_id' => (int) $this->section_id,
            'description' => $this->description,
            'year' => $this->year ?? '',
            'month' => $this->month,
            'type' => $this->getAttribute('api_type') ?? $this->fee_type ?? $this->Fee_type ?? 'monthly',
            'has_payments' => Schema::connection('center')->hasTable('payments')
                && DB::connection('center')->table('payments')->where('fee_id', $this->id)->exists(),
        ];
    }
}
