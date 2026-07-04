<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sessions') && Schema::hasTable('attendances') && ! Schema::hasColumn('attendances', 'session_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->foreignId('session_id')->nullable()->after('section_id')->constrained('sessions')->nullOnDelete();
            });
        }

        if (Schema::hasTable('sessions') && Schema::hasTable('exam_degrees') && ! Schema::hasColumn('exam_degrees', 'session_id')) {
            Schema::table('exam_degrees', function (Blueprint $table) {
                $table->foreignId('session_id')->nullable()->after('section_id')->constrained('sessions')->nullOnDelete();
            });
        }

        if (Schema::hasTable('sessions') && Schema::hasTable('quiz_degrees') && ! Schema::hasColumn('quiz_degrees', 'session_id')) {
            Schema::table('quiz_degrees', function (Blueprint $table) {
                $table->foreignId('session_id')->nullable()->after('section_id')->constrained('sessions')->nullOnDelete();
            });
        }

        if (Schema::hasTable('sessions') && Schema::hasColumn('sessions', 'series_id')) {
            Schema::table('sessions', function (Blueprint $table) {
                if (Schema::hasColumn('sessions', 'series_id')) {
                    $table->dropForeign(['series_id']);
                    $table->dropUnique('sessions_series_id_start_at_unique');
                    $table->dropColumn('series_id');
                }
            });
        }

        Schema::dropIfExists('session_series');
    }

    public function down(): void
    {
        if (Schema::hasTable('attendances') && Schema::hasColumn('attendances', 'session_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropConstrainedForeignId('session_id');
            });
        }

        if (Schema::hasTable('exam_degrees') && Schema::hasColumn('exam_degrees', 'session_id')) {
            Schema::table('exam_degrees', function (Blueprint $table) {
                $table->dropConstrainedForeignId('session_id');
            });
        }

        if (Schema::hasTable('quiz_degrees') && Schema::hasColumn('quiz_degrees', 'session_id')) {
            Schema::table('quiz_degrees', function (Blueprint $table) {
                $table->dropConstrainedForeignId('session_id');
            });
        }
    }
};
