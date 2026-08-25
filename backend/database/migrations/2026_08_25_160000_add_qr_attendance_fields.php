<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::connection('center')->hasTable('sessions')) {
            Schema::connection('center')->table('sessions', function (Blueprint $table): void {
                if (! Schema::connection('center')->hasColumn('sessions', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable()->after('location');
                }
                if (! Schema::connection('center')->hasColumn('sessions', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
                }
                if (! Schema::connection('center')->hasColumn('sessions', 'geofence_radius_m')) {
                    $table->unsignedInteger('geofence_radius_m')->nullable()->after('longitude');
                }
            });
        }

        if (Schema::connection('center')->hasTable('attendances')) {
            Schema::connection('center')->table('attendances', function (Blueprint $table): void {
                if (! Schema::connection('center')->hasColumn('attendances', 'checked_in_at')) {
                    $table->timestamp('checked_in_at')->nullable()->after('notes');
                }
                if (! Schema::connection('center')->hasColumn('attendances', 'check_in_latitude')) {
                    $table->decimal('check_in_latitude', 10, 7)->nullable()->after('checked_in_at');
                }
                if (! Schema::connection('center')->hasColumn('attendances', 'check_in_longitude')) {
                    $table->decimal('check_in_longitude', 10, 7)->nullable()->after('check_in_latitude');
                }
                if (! Schema::connection('center')->hasColumn('attendances', 'check_in_accuracy_m')) {
                    $table->decimal('check_in_accuracy_m', 8, 2)->nullable()->after('check_in_longitude');
                }
                if (! Schema::connection('center')->hasColumn('attendances', 'check_in_distance_m')) {
                    $table->decimal('check_in_distance_m', 10, 2)->nullable()->after('check_in_accuracy_m');
                }
                if (! Schema::connection('center')->hasColumn('attendances', 'check_in_method')) {
                    $table->string('check_in_method', 32)->nullable()->after('check_in_distance_m');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::connection('center')->hasTable('sessions')) {
            Schema::connection('center')->table('sessions', function (Blueprint $table): void {
                foreach (['latitude', 'longitude', 'geofence_radius_m'] as $column) {
                    if (Schema::connection('center')->hasColumn('sessions', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::connection('center')->hasTable('attendances')) {
            Schema::connection('center')->table('attendances', function (Blueprint $table): void {
                foreach ([
                    'checked_in_at',
                    'check_in_latitude',
                    'check_in_longitude',
                    'check_in_accuracy_m',
                    'check_in_distance_m',
                    'check_in_method',
                ] as $column) {
                    if (Schema::connection('center')->hasColumn('attendances', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
