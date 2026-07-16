<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('admins')) {
            return;
        }

        Schema::table('admins', function (Blueprint $table) {
            if (! Schema::hasColumn('admins', 'push_subscription')) {
                $table->text('push_subscription')->nullable()->after('password');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('admins') || ! Schema::hasColumn('admins', 'push_subscription')) {
            return;
        }

        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn('push_subscription');
        });
    }
};
