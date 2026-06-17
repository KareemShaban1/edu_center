<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFeesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fees', function (Blueprint $table) {
            $table->string('center_id', 36)->nullable()->index();;
            
            $table->id();
            $table->string('title');
            $table->decimal('amount',8,2);
            $table->foreignId('grade_id')->references('id')->on('grades')->onDelete('cascade');
            $table->foreignId('class_id')->references('id')->on('classes')->onDelete('cascade');            
            $table->foreignId('section_id')->references('id')->on('sections')->onDelete('cascade');
            $table->string('description')->nullable();
            $table->string('year')->nullable();
            $table->string('month');
            $table->enum('fee_type',['monthly','half-monthly','book','other'])->default('monthly');
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
        Schema::dropIfExists('fees');
    }
}
