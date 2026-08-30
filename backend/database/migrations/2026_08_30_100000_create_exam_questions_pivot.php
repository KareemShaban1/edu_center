<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('center')->hasTable('exam_questions')) {
            Schema::connection('center')->create('exam_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();

                $table->unique(['exam_id', 'question_id']);
            });
        }

        if (Schema::connection('center')->hasColumn('questions', 'exam_id')) {
            $rows = DB::connection('center')->table('questions')
                ->whereNotNull('exam_id')
                ->orderBy('exam_id')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            foreach ($rows as $row) {
                $exists = DB::connection('center')->table('exam_questions')
                    ->where('exam_id', $row->exam_id)
                    ->where('question_id', $row->id)
                    ->exists();

                if (! $exists) {
                    DB::connection('center')->table('exam_questions')->insert([
                        'exam_id' => $row->exam_id,
                        'question_id' => $row->id,
                        'sort_order' => $row->sort_order ?? 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            Schema::connection('center')->table('questions', function (Blueprint $table) {
                $table->dropForeign(['exam_id']);
                $table->dropColumn(['exam_id', 'sort_order']);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::connection('center')->hasColumn('questions', 'exam_id')) {
            Schema::connection('center')->table('questions', function (Blueprint $table) {
                $table->unsignedBigInteger('exam_id')->nullable()->after('lesson_id');
                $table->unsignedSmallInteger('sort_order')->default(0)->after('type');
            });
            Schema::connection('center')->table('questions', function (Blueprint $table) {
                $table->foreign('exam_id')->references('id')->on('exams')->nullOnDelete();
            });
        }

        if (Schema::connection('center')->hasTable('exam_questions')) {
            $pivotRows = DB::connection('center')->table('exam_questions')->get();
            foreach ($pivotRows as $row) {
                DB::connection('center')->table('questions')
                    ->where('id', $row->question_id)
                    ->update([
                        'exam_id' => $row->exam_id,
                        'sort_order' => $row->sort_order,
                    ]);
            }

            Schema::connection('center')->dropIfExists('exam_questions');
        }
    }
};
