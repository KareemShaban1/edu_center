<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quiz_degrees', function (Blueprint $table) {
            $table->unsignedBigInteger('center_id')->nullable()->index();;
            $table->id();
            $table->foreignId('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreignId('grade_id')->references('id')->on('grades')->onDelete('cascade');
            $table->foreignId('class_id')->references('id')->on('classes')->onDelete('cascade');            
            $table->foreignId('section_id')->references('id')->on('sections')->onDelete('cascade');
	  // attendance_status
	  $table->enum('attendance_status', ['present', 'absent','late'])->default('absent');
	  $table->date('quiz_date');
            $table->string('degree');
            $table->string('notes')->nullable();
            // in progress
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quiz');
    }
};
