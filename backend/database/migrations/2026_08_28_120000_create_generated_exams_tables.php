<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('center')->create('generated_exams', function (Blueprint $table) {
            $table->unsignedBigInteger('center_id')->nullable()->index();
            $table->id();
            $table->string('name');
            $table->foreignId('grade_id')->references('id')->on('grades')->onDelete('cascade');
            $table->foreignId('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->unsignedSmallInteger('total_questions');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::connection('center')->create('generated_exam_lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_exam_id')->constrained('generated_exams')->onDelete('cascade');
            $table->foreignId('lesson_id')->references('id')->on('lessons')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['generated_exam_id', 'lesson_id']);
        });

        Schema::connection('center')->create('generated_exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_exam_id')->constrained('generated_exams')->onDelete('cascade');
            $table->foreignId('question_id')->references('id')->on('questions')->onDelete('cascade');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['generated_exam_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::connection('center')->dropIfExists('generated_exam_questions');
        Schema::connection('center')->dropIfExists('generated_exam_lessons');
        Schema::connection('center')->dropIfExists('generated_exams');
    }
};
