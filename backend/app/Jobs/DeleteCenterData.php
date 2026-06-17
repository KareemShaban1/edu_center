<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Platform\Center;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DeleteCenterData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Center $center)
    {
    }

    public function handle(): void
    {
        $centerId = $this->center->id;
        $connection = config('database.default', 'mysql');

        DB::connection($connection)->table('center_memberships')->where('center_id', $centerId)->delete();

        foreach (array_reverse(config('centers.scoped_tables', [])) as $tableName) {
            if (! Schema::connection($connection)->hasTable($tableName)) {
                continue;
            }

            $column = Schema::connection($connection)->hasColumn($tableName, 'center_id')
                ? 'center_id'
                : (Schema::connection($connection)->hasColumn($tableName, 'tenant_id') ? 'tenant_id' : null);

            if (! $column) {
                continue;
            }

            DB::connection($connection)->table($tableName)->where($column, $centerId)->delete();
        }
    }
}
