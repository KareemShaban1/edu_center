<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('center_memberships', function (Blueprint $table) {
            $table->id();
            $table->string('center_id', 36);
            $table->unsignedBigInteger('user_id');
            $table->string('user_type');
            $table->string('status', 16)->default('assigned');
            $table->timestamps();

            $table->foreign('center_id')->references('id')->on('centers')->cascadeOnDelete();
            $table->unique(['center_id', 'user_id', 'user_type'], 'center_memberships_center_user_unique');
            $table->index(['center_id', 'user_type', 'user_id'], 'center_memberships_center_type_user_idx');
            $table->index(['user_type', 'user_id', 'status'], 'center_memberships_type_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('center_memberships');
    }
};
