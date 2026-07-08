<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('certification_templates')) {
            return;
        }

        if (! Schema::hasColumn('certification_templates', 'is_system')) {
            Schema::table('certification_templates', function (Blueprint $table) {
                $table->boolean('is_system')->default(false)->after('variables');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('certification_templates') && Schema::hasColumn('certification_templates', 'is_system')) {
            Schema::table('certification_templates', function (Blueprint $table) {
                $table->dropColumn('is_system');
            });
        }
    }
};
