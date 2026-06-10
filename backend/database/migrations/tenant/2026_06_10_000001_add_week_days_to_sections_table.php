<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sections')) {
            return;
        }

        Schema::table('sections', function (Blueprint $table) {
            if (! Schema::hasColumn('sections', 'week_days')) {
                $table->json('week_days')->nullable()->after('class_id');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('sections')) {
            return;
        }

        Schema::table('sections', function (Blueprint $table) {
            if (Schema::hasColumn('sections', 'week_days')) {
                $table->dropColumn('week_days');
            }
        });
    }
};
