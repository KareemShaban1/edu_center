<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('centers', function (Blueprint $table) {
            $table->foreignId('governorate_id')->nullable()->after('address')->constrained('governorates')->nullOnDelete();
            $table->foreignId('city_id')->nullable()->after('governorate_id')->constrained('cities')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->after('city_id')->constrained('areas')->nullOnDelete();
            $table->decimal('lat', 10, 7)->nullable()->after('area_id');
            $table->decimal('long', 10, 7)->nullable()->after('lat');
        });

        Schema::table('centers', function (Blueprint $table) {
            $table->dropColumn('city');
        });
    }

    public function down(): void
    {
        Schema::table('centers', function (Blueprint $table) {
            $table->string('city')->nullable()->after('address');
        });

        Schema::table('centers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('governorate_id');
            $table->dropConstrainedForeignId('city_id');
            $table->dropConstrainedForeignId('area_id');
            $table->dropColumn(['lat', 'long']);
        });
    }
};
