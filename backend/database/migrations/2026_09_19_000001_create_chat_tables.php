<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->index();
            $table->string('type', 16);
            $table->string('title')->nullable();
            $table->string('created_by_type', 32);
            $table->unsignedBigInteger('created_by_id');
            $table->timestamps();

            $table->index(['center_id', 'type']);
            $table->index(['created_by_type', 'created_by_id']);
        });

        Schema::create('chat_participants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->index();
            $table->unsignedBigInteger('conversation_id');
            $table->string('participant_type', 32);
            $table->unsignedBigInteger('participant_id');
            $table->unsignedBigInteger('last_read_message_id')->nullable();
            $table->timestamps();

            $table->unique(
                ['conversation_id', 'participant_type', 'participant_id'],
                'chat_participants_unique'
            );
            $table->index(['participant_type', 'participant_id'], 'chat_participants_actor_index');
            $table->foreign('conversation_id')
                ->references('id')
                ->on('chat_conversations')
                ->cascadeOnDelete();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->index();
            $table->unsignedBigInteger('conversation_id');
            $table->string('sender_type', 32);
            $table->unsignedBigInteger('sender_id');
            $table->string('type', 16);
            $table->text('body')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'id']);
            $table->index(['sender_type', 'sender_id']);
            $table->foreign('conversation_id')
                ->references('id')
                ->on('chat_conversations')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_participants');
        Schema::dropIfExists('chat_conversations');
    }
};
