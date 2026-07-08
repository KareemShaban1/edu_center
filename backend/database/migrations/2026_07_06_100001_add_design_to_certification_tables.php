<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('certification_templates')) {
            Schema::table('certification_templates', function (Blueprint $table) {
                if (! Schema::hasColumn('certification_templates', 'design_id')) {
                    $table->string('design_id', 64)->nullable()->after('variables');
                }
                if (! Schema::hasColumn('certification_templates', 'design')) {
                    $table->json('design')->nullable()->after('design_id');
                }
            });
        }

        if (Schema::hasTable('student_certifications')) {
            Schema::table('student_certifications', function (Blueprint $table) {
                if (! Schema::hasColumn('student_certifications', 'design')) {
                    $table->json('design')->nullable()->after('variables');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('certification_templates')) {
            Schema::table('certification_templates', function (Blueprint $table) {
                if (Schema::hasColumn('certification_templates', 'design')) {
                    $table->dropColumn('design');
                }
                if (Schema::hasColumn('certification_templates', 'design_id')) {
                    $table->dropColumn('design_id');
                }
            });
        }

        if (Schema::hasTable('student_certifications')) {
            Schema::table('student_certifications', function (Blueprint $table) {
                if (Schema::hasColumn('student_certifications', 'design')) {
                    $table->dropColumn('design');
                }
            });
        }
    }
};
