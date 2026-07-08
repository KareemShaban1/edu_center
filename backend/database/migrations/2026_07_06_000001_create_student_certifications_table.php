<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_certifications', function (Blueprint $table) {
            $table->unsignedBigInteger('center_id')->nullable()->index();
            $table->id();
            $table->unsignedBigInteger('template_id')->nullable()->index();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('section_id')->nullable()->index();
            $table->string('title');
            $table->text('content');
            $table->json('variables')->nullable();
            $table->string('context')->default('manual');
            $table->date('context_date')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->unsignedBigInteger('issued_by')->nullable();
            $table->boolean('is_custom')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_certifications');
    }
};
