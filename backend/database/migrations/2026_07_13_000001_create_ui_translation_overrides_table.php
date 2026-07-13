<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ui_translation_overrides', function (Blueprint $table) {
            $table->id();
            $table->string('translation_key')->unique();
            $table->text('en_value')->nullable();
            $table->text('ar_value')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ui_translation_overrides');
    }
};
