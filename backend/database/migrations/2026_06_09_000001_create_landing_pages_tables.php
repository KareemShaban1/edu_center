<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->nullable()->index();
            $table->string('slug')->unique();
            $table->json('title');
            $table->string('type', 32)->default('custom');
            $table->string('status', 16)->default('draft');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->string('subject_key')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->unsignedBigInteger('event_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->json('sections');
            $table->json('theme');
            $table->json('seo');
            $table->json('branding')->nullable();
            $table->string('template_id')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index('teacher_id');
        });

        Schema::create('landing_page_revisions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->nullable()->index();
            $table->foreignId('landing_page_id')->constrained('landing_pages')->cascadeOnDelete();
            $table->json('snapshot');
            $table->string('label')->nullable();
            $table->timestamps();
        });

        Schema::create('landing_page_analytics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->nullable()->index();
            $table->foreignId('landing_page_id')->constrained('landing_pages')->cascadeOnDelete();
            $table->unsignedBigInteger('visitors')->default(0);
            $table->unsignedBigInteger('unique_visitors')->default(0);
            $table->unsignedInteger('form_submissions')->default(0);
            $table->unsignedInteger('cta_clicks')->default(0);
            $table->unsignedInteger('leads')->default(0);
            $table->json('device_stats')->nullable();
            $table->json('traffic_sources')->nullable();
            $table->json('daily_views')->nullable();
            $table->timestamps();
        });

        Schema::create('landing_media', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id')->nullable()->index();
            $table->string('name');
            $table->string('type', 16);
            $table->string('url');
            $table->string('folder')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_media');
        Schema::dropIfExists('landing_page_analytics');
        Schema::dropIfExists('landing_page_revisions');
        Schema::dropIfExists('landing_pages');
    }
};
