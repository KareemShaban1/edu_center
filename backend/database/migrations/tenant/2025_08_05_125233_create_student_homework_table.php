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
        Schema::create('student_homework', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->references('id')->on('students')->onDelete('cascade');  
            $table->foreignId('homework_id')->references('id')->on('homeworks')->onDelete('cascade');  
            $table->dateTime('upload_date_time');
            $table->enum('status',['not_submitted','submitted','late','approved','rejected']);
            $table->string('degree')->nullable();
            $table->string('rate')->nullable();
            $table->text('student_notes')->nullable();
            $table->text('response')->nullable();
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
        Schema::dropIfExists('student_homework');
    }
};
