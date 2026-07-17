<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_todos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->index();
            $table->string('owner_guard', 32);
            $table->unsignedBigInteger('owner_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority', 16)->default('medium');
            $table->dateTime('due_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->index(['center_id', 'owner_guard', 'owner_id'], 'personal_todos_owner_index');
            $table->index(['center_id', 'owner_guard', 'owner_id', 'completed_at'], 'personal_todos_status_index');
        });

        Schema::create('personal_notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->index();
            $table->string('owner_guard', 32);
            $table->unsignedBigInteger('owner_id');
            $table->string('title');
            $table->longText('content');
            $table->string('color', 16)->default('slate');
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();

            $table->index(['center_id', 'owner_guard', 'owner_id'], 'personal_notes_owner_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_notes');
        Schema::dropIfExists('personal_todos');
    }
};
