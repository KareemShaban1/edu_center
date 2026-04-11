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
        Schema::create('homeworks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->foreignId('grade_id')->references('id')->on('grades')->onDelete('cascade');  
            $table->foreignId('class_id')->references('id')->on('classes')->onDelete('cascade');  
            $table->foreignId('section_id')->references('id')->on('sections')->onDelete('cascade');  
            $table->dateTime('submit_date');
            $table->dateTime('due_date');
            $table->string('final_degree')->nullable();
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
        Schema::dropIfExists('homework');
    }
};
