<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('meetings')) {
            Schema::create('meetings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('grade_id')->references('id')->on('grades')->onDelete('cascade');
                $table->foreignId('class_id')->references('id')->on('classes')->onDelete('cascade');
                $table->foreignId('section_id')->references('id')->on('sections')->onDelete('cascade');
                $table->string('created_by');
                $table->string('topic');
                $table->dateTime('start_at');
                $table->unsignedInteger('duration')->comment('minutes');
                $table->string('provider', 32)->default('jitsi')->comment('jitsi, livekit, external');
                $table->string('room_slug', 191)->nullable();
                $table->text('join_url');
                $table->text('moderator_url')->nullable();
                $table->string('password')->nullable();
                $table->boolean('record_enabled')->default(false);
                $table->string('external_ref', 255)->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('online_classes')) {
            $rows = DB::table('online_classes')->get();
            foreach ($rows as $row) {
                DB::table('meetings')->insert([
                    'grade_id' => $row->grade_id,
                    'class_id' => $row->class_id,
                    'section_id' => $row->section_id,
                    'created_by' => $row->created_by,
                    'topic' => $row->topic,
                    'start_at' => $row->start_at,
                    'duration' => $row->duration,
                    'provider' => 'external',
                    'room_slug' => null,
                    'join_url' => $row->join_url ?: '#',
                    'moderator_url' => $row->start_url ?: null,
                    'password' => $row->password ?: null,
                    'record_enabled' => false,
                    'external_ref' => $row->meeting_id ?? null,
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => $row->updated_at ?? now(),
                ]);
            }
            Schema::drop('online_classes');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
