<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->unsignedBigInteger('center_id')->nullable()->index();
                $table->id();
                $table->foreignId('grade_id')->references('id')->on('grades')->onDelete('cascade');
                $table->foreignId('class_id')->references('id')->on('classes')->onDelete('cascade');
                $table->foreignId('section_id')->references('id')->on('sections')->onDelete('cascade');
                $table->string('created_by');
                $table->string('topic');
                $table->enum('session_type', ['offline', 'online', 'exam', 'others'])->default('online');
                $table->string('provider', 32)->nullable()->comment('jitsi,livekit,zoom,microsoft_teams,google_meet,external when session_type=online');
                $table->dateTime('start_at');
                $table->unsignedInteger('duration')->comment('minutes');
                $table->string('room_slug', 191)->nullable();
                $table->text('join_url');
                $table->text('moderator_url')->nullable();
                $table->string('password')->nullable();
                $table->boolean('record_enabled')->default(false);
                $table->string('external_ref', 255)->nullable();
                $table->text('location')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
