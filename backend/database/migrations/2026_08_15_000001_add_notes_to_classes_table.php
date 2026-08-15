<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('center')->hasTable('classes')) {
            return;
        }

        if (Schema::connection('center')->hasColumn('classes', 'notes')) {
            return;
        }

        Schema::connection('center')->table('classes', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('grade_id');
        });
    }

    public function down(): void
    {
        if (! Schema::connection('center')->hasTable('classes')) {
            return;
        }

        if (! Schema::connection('center')->hasColumn('classes', 'notes')) {
            return;
        }

        Schema::connection('center')->table('classes', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
