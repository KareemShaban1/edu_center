<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Platform\Center;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BackfillCenterScopedData extends Command
{
    protected $signature = 'centers:backfill-scoped-data {--center= : Center id to assign when rows have no center_id}';

    protected $description = 'Assign center_id to scoped rows that were created without center context';

    public function handle(): int
    {
        $centerId = $this->option('center');

        if (! $centerId) {
            if (Center::query()->count() === 1) {
                $centerId = (int) Center::query()->value('id');
            } else {
                $this->error('Multiple centers exist. Pass --center=<id>.');

                return self::FAILURE;
            }
        }

        if (! Center::query()->where('id', $centerId)->exists()) {
            $this->error("Center [{$centerId}] not found.");

            return self::FAILURE;
        }

        $tables = array_unique(array_merge(
            config('centers.scoped_tables', []),
            array_keys(config('centers.membership_scoped_tables', [])),
        ));

        $updatedTotal = 0;

        foreach ($tables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'center_id')) {
                continue;
            }

            $payload = ['center_id' => $centerId];
            if (Schema::hasColumn($table, 'updated_at')) {
                $payload['updated_at'] = now();
            }

            $count = DB::table($table)->whereNull('center_id')->update($payload);

            if ($count > 0) {
                $this->line("  ✓ {$table}: {$count} rows");
                $updatedTotal += $count;
            }
        }

        $this->info("Backfilled {$updatedTotal} rows with center_id={$centerId}.");

        return self::SUCCESS;
    }
}
