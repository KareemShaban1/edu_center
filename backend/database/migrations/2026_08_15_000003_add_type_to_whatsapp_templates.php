<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('center')->hasTable('whatsapp_templates')) {
            return;
        }

        if (Schema::connection('center')->hasColumn('whatsapp_templates', 'type')) {
            return;
        }

        Schema::connection('center')->table('whatsapp_templates', function (Blueprint $table) {
            $table->string('type', 32)->nullable()->default('general')->after('name');
        });
    }

    public function down(): void
    {
        if (! Schema::connection('center')->hasTable('whatsapp_templates')) {
            return;
        }

        if (! Schema::connection('center')->hasColumn('whatsapp_templates', 'type')) {
            return;
        }

        Schema::connection('center')->table('whatsapp_templates', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
