<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<string> */
    private array $centerIdTables = [
        'center_memberships',
        'users',
        'teachers',
        'grades',
        'classes',
        'sections',
        'teacher_section',
        'fees',
        'payments',
        'attendances',
        'homeworks',
        'student_homework',
        'quiz_degrees',
        'exam_degrees',
        'library',
        'announcements',
        'events',
        'images',
        'parent_attachments',
        'settings',
        'whatsapp_templates',
        'certification_templates',
        'activity_logs',
        'months',
        'genders',
        'rooms',
        'meetings',
        'meeting_series',
        'notes',
        'units',
        'lessons',
        'questions',
        'answers',
        'words',
        'landing_pages',
        'landing_page_revisions',
        'landing_page_analytics',
        'landing_media',
        'media',
        'notifications',
        'online_classes',
        'roles',
        'permissions',
        'model_has_roles',
        'model_has_permissions',
        'role_has_permissions',
        'failed_jobs',
        'password_resets',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('centers')) {
            return;
        }

        $columnInfo = DB::selectOne(
            "SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'centers' AND COLUMN_NAME = 'id'"
        );
        $idColumnType = strtolower((string) ($columnInfo->DATA_TYPE ?? ''));

        if (in_array($idColumnType, ['bigint', 'int', 'integer'], true)) {
            return;
        }

        Schema::disableForeignKeyConstraints();

        if (Schema::hasTable('center_memberships')) {
            Schema::table('center_memberships', function (Blueprint $table) {
                $table->dropForeign(['center_id']);
            });
        }

        $mapping = [];
        $nextId = 1;
        foreach (DB::table('centers')->orderBy('created_at')->get() as $center) {
            $mapping[(string) $center->id] = $nextId++;
        }

        Schema::create('centers_new', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->json('data')->nullable();
            $table->timestamps();
        });

        foreach (DB::table('centers')->orderBy('created_at')->get() as $center) {
            DB::table('centers_new')->insert([
                'id' => $mapping[(string) $center->id],
                'name' => $center->name,
                'slug' => $center->slug,
                'domain' => $center->domain,
                'email' => $center->email,
                'phone' => $center->phone,
                'address' => $center->address,
                'city' => $center->city,
                'status' => $center->status,
                'data' => $center->data,
                'created_at' => $center->created_at,
                'updated_at' => $center->updated_at,
            ]);
        }

        foreach ($this->centerIdTables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'center_id')) {
                continue;
            }

            foreach ($mapping as $oldId => $newId) {
                DB::table($table)->where('center_id', $oldId)->update(['center_id' => $newId]);
            }

            DB::statement("ALTER TABLE `{$table}` MODIFY `center_id` BIGINT UNSIGNED NULL");
        }

        Schema::drop('centers');
        Schema::rename('centers_new', 'centers');

        if (Schema::hasTable('center_memberships')) {
            Schema::table('center_memberships', function (Blueprint $table) {
                $table->foreign('center_id')->references('id')->on('centers')->cascadeOnDelete();
            });
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Non-reversible without data loss.
    }
};
