<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('mysql')->hasColumn('students', 'phone')) {
            Schema::connection('mysql')->table('students', function (Blueprint $table) {
                $table->string('phone', 20)->nullable()->after('email');
            });
        }

        $this->ensureUniqueIndex('students', 'phone', 'students_phone_unique');
        $this->ensureUniqueIndex('parents', 'parent_phone', 'parents_parent_phone_unique');
    }

    public function down(): void
    {
        $this->dropUniqueIndexIfExists('students', 'students_phone_unique');
        $this->dropUniqueIndexIfExists('parents', 'parents_parent_phone_unique');

        if (Schema::connection('mysql')->hasColumn('students', 'phone')) {
            Schema::connection('mysql')->table('students', function (Blueprint $table) {
                $table->dropColumn('phone');
            });
        }
    }

    protected function ensureUniqueIndex(string $table, string $column, string $indexName): void
    {
        if (! Schema::connection('mysql')->hasColumn($table, $column)) {
            return;
        }

        $exists = DB::connection('mysql')->selectOne(
            'SELECT 1 FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = ?
               AND index_name = ?
             LIMIT 1',
            [$table, $indexName]
        );

        if ($exists) {
            return;
        }

        Schema::connection('mysql')->table($table, function (Blueprint $blueprint) use ($column, $indexName) {
            $blueprint->unique($column, $indexName);
        });
    }

    protected function dropUniqueIndexIfExists(string $table, string $indexName): void
    {
        $exists = DB::connection('mysql')->selectOne(
            'SELECT 1 FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = ?
               AND index_name = ?
             LIMIT 1',
            [$table, $indexName]
        );

        if (! $exists) {
            return;
        }

        Schema::connection('mysql')->table($table, function (Blueprint $blueprint) use ($indexName) {
            $blueprint->dropUnique($indexName);
        });
    }
};
