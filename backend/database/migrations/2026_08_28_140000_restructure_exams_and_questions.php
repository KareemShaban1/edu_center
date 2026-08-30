<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::connection('center')->hasTable('generated_exams') && ! Schema::connection('center')->hasTable('exams')) {
            Schema::connection('center')->rename('generated_exams', 'exams');
        }

        if (Schema::connection('center')->hasTable('generated_exam_lessons') && ! Schema::connection('center')->hasTable('exam_lessons')) {
            Schema::connection('center')->rename('generated_exam_lessons', 'exam_lessons');
        }

        if (Schema::connection('center')->hasColumn('exam_lessons', 'generated_exam_id')) {
            DB::connection('center')->statement('ALTER TABLE `exam_lessons` DROP FOREIGN KEY `generated_exam_lessons_generated_exam_id_foreign`');
            DB::connection('center')->statement('ALTER TABLE `exam_lessons` DROP INDEX `generated_exam_lessons_generated_exam_id_lesson_id_unique`');
            DB::connection('center')->statement('ALTER TABLE `exam_lessons` CHANGE `generated_exam_id` `exam_id` BIGINT UNSIGNED NOT NULL');
            DB::connection('center')->statement('ALTER TABLE `exam_lessons` ADD UNIQUE `exam_lessons_exam_id_lesson_id_unique` (`exam_id`, `lesson_id`)');
            DB::connection('center')->statement('ALTER TABLE `exam_lessons` ADD CONSTRAINT `exam_lessons_exam_id_foreign` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE');
        }

        if (! Schema::connection('center')->hasColumn('questions', 'exam_id')) {
            Schema::connection('center')->table('questions', function (Blueprint $table) {
                $table->unsignedBigInteger('exam_id')->nullable()->after('lesson_id');
                $table->unsignedSmallInteger('sort_order')->default(0)->after('type');
            });
            Schema::connection('center')->table('questions', function (Blueprint $table) {
                $table->foreign('exam_id')->references('id')->on('exams')->nullOnDelete();
            });
        }

        if (Schema::connection('center')->hasTable('generated_exam_questions')) {
            $pivotRows = DB::connection('center')->table('generated_exam_questions')->get();
            foreach ($pivotRows as $row) {
                DB::connection('center')->table('questions')
                    ->where('id', $row->question_id)
                    ->update([
                        'exam_id' => $row->generated_exam_id,
                        'sort_order' => $row->sort_order,
                    ]);
            }
            Schema::connection('center')->dropIfExists('generated_exam_questions');
        }

        if (Schema::connection('center')->hasColumn('questions', 'lesson_id')) {
            DB::connection('center')->statement('ALTER TABLE `questions` MODIFY `lesson_id` BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        if (Schema::connection('center')->hasColumn('questions', 'exam_id')) {
            Schema::connection('center')->table('questions', function (Blueprint $table) {
                $table->dropForeign(['exam_id']);
                $table->dropColumn(['exam_id', 'sort_order']);
            });
        }
    }
};
