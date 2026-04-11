<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasIndex = static function (string $table, string $indexName): bool {
            $database = DB::connection('tenant')->getDatabaseName();
            if (!$database) {
                return false;
            }

            $row = DB::connection('tenant')->selectOne(
                'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
                [$database, $table, $indexName]
            );

            return $row !== null;
        };

        if (!Schema::hasTable('meeting_series')) {
            Schema::create('meeting_series', function (Blueprint $table) {
                $table->id();
                $table->string('created_by');
                $table->foreignId('grade_id')->constrained('grades')->onDelete('cascade');
                $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
                $table->foreignId('section_id')->constrained('sections')->onDelete('cascade');
$table->foreignId('teacher_id')->constrained('teachers')->onDelete('cascade');

                $table->string('topic');

                // online providers: jitsi, livekit, zoom, microsoft_teams, google_meet, external
                // offline provider: offline
                $table->string('provider', 32)
                    ->default('offline')
                    ->comment('offline,jitsi,livekit,zoom,microsoft_teams,google_meet,external');

                // ISO week days: 1=Mon ... 7=Sun
                $table->json('week_days');
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->time('start_time');

                $table->unsignedInteger('duration')->comment('minutes');
                $table->boolean('record_enabled')->default(false);

            // status
            $table->enum('status', ['started','going_on','completed','cancelled'])->default('started');

          // Used when provider=external
                $table->text('join_url')->nullable();
                $table->text('moderator_url')->nullable();
                $table->string('password')->nullable();
                $table->string('external_ref', 255)->nullable();

                // Used when provider=offline
                $table->text('location')->nullable();
                $table->text('notes')->nullable();

                $table->timestamps();
            });
        }

        if (Schema::hasTable('meetings')) {
            Schema::table('meetings', function (Blueprint $table) use ($hasIndex) {
                if (!Schema::hasColumn('meetings', 'series_id')) {
                    $table->foreignId('series_id')->nullable()->constrained('meeting_series')->nullOnDelete();
                }

                if (!Schema::hasColumn('meetings', 'location')) {
                    $table->text('location')->nullable();
                }

                if (!Schema::hasColumn('meetings', 'notes')) {
                    $table->text('notes')->nullable();
                }

                // Idempotency for generator: one occurrence per series+start_at.
                if (!$hasIndex('meetings', 'meetings_series_id_start_at_unique')) {
                    $table->unique(['series_id', 'start_at'], 'meetings_series_id_start_at_unique');
                }
            });
        }
    }

    public function down(): void
    {
        $hasIndex = static function (string $table, string $indexName): bool {
            $database = DB::connection('tenant')->getDatabaseName();
            if (!$database) {
                return false;
            }

            $row = DB::connection('tenant')->selectOne(
                'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
                [$database, $table, $indexName]
            );

            return $row !== null;
        };

        Schema::table('meetings', function (Blueprint $table) use ($hasIndex) {
            if (Schema::hasColumn('meetings', 'series_id')) {
                if ($hasIndex('meetings', 'meetings_series_id_start_at_unique')) {
                    $table->dropUnique('meetings_series_id_start_at_unique');
                }
                $table->dropConstrainedForeignId('series_id');
                $table->dropColumn('series_id');
            }
            if (Schema::hasColumn('meetings', 'location')) $table->dropColumn('location');
            if (Schema::hasColumn('meetings', 'notes')) $table->dropColumn('notes');
        });

        Schema::dropIfExists('meeting_series');
    }
};
