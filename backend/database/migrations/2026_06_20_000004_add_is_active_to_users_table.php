<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::connection('center')->hasColumn('users', 'is_active')) {
            return;
        }

        Schema::connection('center')->table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('password');
        });
    }

    public function down(): void
    {
        if (! Schema::connection('center')->hasColumn('users', 'is_active')) {
            return;
        }

        Schema::connection('center')->table('users', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
