<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('center')->hasTable('announcements')) {
            return;
        }

        $driver = Schema::connection('center')->getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::connection('center')->statement(
                "ALTER TABLE announcements MODIFY announcement_type VARCHAR(32) NOT NULL DEFAULT 'others'"
            );
        }
    }

    public function down(): void
    {
        if (! Schema::connection('center')->hasTable('announcements')) {
            return;
        }

        $driver = Schema::connection('center')->getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::connection('center')->statement(
                "ALTER TABLE announcements MODIFY announcement_type ENUM('quiz','exam','others') NOT NULL DEFAULT 'others'"
            );
        }
    }
};
