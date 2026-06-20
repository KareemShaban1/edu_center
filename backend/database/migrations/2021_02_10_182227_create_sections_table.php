<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSectionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->unsignedBigInteger('center_id')->nullable()->index();;
            $table->id();
            $table->string('section_name');
            $table->integer('status');
            // $table->foreignId('teacher_id')->references('id')->on('teachers')
            // ->cascadeOnDelete();
            $table->foreignId('grade_id')->references('id')->on('grades')
                ->cascadeOnDelete();
            $table->foreignId('class_id')->references('id')->on('classes')
                ->cascadeOnDelete();
            
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
        Schema::dropIfExists('sections');
    }
}
