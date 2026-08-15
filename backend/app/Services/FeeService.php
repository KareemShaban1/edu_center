<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\Fee;
use App\Models\Platform\Center;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class FeeService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(array $payload, Center $tenant): Fee
    {
        $fee = DB::connection('center')->transaction(function () use ($payload, $tenant): Fee {
            $fee = new Fee();
            $fee->setConnection('center');
            $this->fillFee($fee, $payload);
            CenterIdAssigner::assign($fee, (int) $tenant->id);
            $fee->save();

            return $fee;
        });

        $fee->setAttribute('api_type', (string) $payload['type']);

        return $fee;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(Fee $fee, array $payload, Center $tenant): Fee
    {
        DB::connection('center')->transaction(function () use ($fee, $payload, $tenant): void {
            $this->fillFee($fee, $payload);
            CenterIdAssigner::assign($fee, (int) $tenant->id, onlyIfMissing: true);
            $fee->save();
        });

        $fee->setAttribute('api_type', (string) $payload['type']);

        return $fee;
    }

    public function delete(int $id): ?string
    {
        $exists = Fee::on('center')->where('id', $id)->exists();
        if (! $exists) {
            return null;
        }

        if (Schema::connection('center')->hasTable('payments')
            && DB::connection('center')->table('payments')->where('fee_id', $id)->exists()) {
            return 'related';
        }

        Fee::on('center')->where('id', $id)->delete();

        return 'deleted';
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillFee(Fee $fee, array $payload): void
    {
        $fee->title = (string) $payload['title'];
        $fee->amount = $payload['amount'];
        $fee->grade_id = (int) $payload['grade_id'];
        $fee->class_id = (int) $payload['classroom_id'];
        $fee->section_id = (int) $payload['section_id'];
        $fee->description = $payload['description'] ?? null;
        $fee->year = $payload['year'] ?? null;
        $fee->month = (string) $payload['month'];

        $this->assignFeeType($fee, (string) $payload['type']);
    }

    private function assignFeeType(Fee $fee, string $type): void
    {
        if (Schema::connection('center')->hasColumn('fees', 'fee_type')) {
            $fee->setAttribute('fee_type', $type);

            return;
        }

        if (Schema::connection('center')->hasColumn('fees', 'Fee_type')) {
            $fee->setAttribute('Fee_type', $type);
        }
    }
}
