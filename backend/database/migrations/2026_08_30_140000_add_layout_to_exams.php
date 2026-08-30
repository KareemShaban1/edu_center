<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('center')->hasColumn('exams', 'layout')) {
            Schema::connection('center')->table('exams', function (Blueprint $table) {
                $table->json('layout')->nullable()->after('notes');
            });
        }
    }

    public function down(): void
    {
        if (Schema::connection('center')->hasColumn('exams', 'layout')) {
            Schema::connection('center')->table('exams', function (Blueprint $table) {
                $table->dropColumn('layout');
            });
        }
    }
};
