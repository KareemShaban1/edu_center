<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('library', function (Blueprint $table) {
            $table->string('center_id', 36)->nullable()->index();;
          $table->id();
          $table->string('title');
          $table->foreignId('grade_id')->references('id')->on('grades')->onDelete('cascade');
          $table->foreignId('class_id')->references('id')->on('classes')->onDelete('cascade');            
          $table->foreignId('section_id')->references('id')->on('sections')->onDelete('cascade');
	$table->enum('type', ['textbook', 'manual', 'workbook', 'reference', 'resource'])->default('textbook');
	// notes
	$table->text('notes')->nullable();
	$table->softDeletes();
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
        Schema::dropIfExists('library');
    }
}
