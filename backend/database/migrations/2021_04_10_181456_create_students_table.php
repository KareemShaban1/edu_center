<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->text('name');
            $table->string('email');
            $table->string('password');

            $table->enum('gender', ['male', 'female'])->default('male');

            $table->foreignId('grade_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('class_id')->nullable()->constrained()->onDelete('set null');            
            $table->foreignId('section_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('parent_id')->nullable()->constrained()->onDelete('set null');

            $table->boolean('is_active')->default(true);

            
            $table->string('academic_year');

            $table->string('notes')->nullable();


            $table->text('push_subscription')->nullable();

            
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
        Schema::dropIfExists('students');
    }
}
