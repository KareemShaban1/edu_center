<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGradesTable extends Migration
{

	public function up()
	{
	Schema::create('grades', function (Blueprint $table) {
            $table->unsignedBigInteger('center_id')->nullable()->index();;
		$table->id();
		$table->string('grade_name');
		$table->text('notes')->nullable();
		$table->timestamps();
	});
	}

	public function down()
	{
		Schema::drop('Grades');
	}
}
