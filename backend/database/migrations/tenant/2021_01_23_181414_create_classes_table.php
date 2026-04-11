<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClassesTable extends Migration
{

	public function up()
	{
	Schema::create('classes', function (Blueprint $table) {
		$table->id();
		$table->string('class_name');
		$table->foreignId('grade_id')->references('id')->on('grades')
			->cascadeOnDelete();
		$table->timestamps();
	});
	}

	public function down()
	{
		Schema::drop('Classrooms');
	}
}
