<?php

declare(strict_types=1);

use App\Models\Parents;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('center_memberships')) {
            return;
        }

        if (! Schema::hasColumn('center_memberships', 'user_id')) {
            Schema::table('center_memberships', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('center_id');
                $table->string('user_type')->nullable()->after('user_id');
            });
        }

        if (Schema::hasColumn('center_memberships', 'profile_id')) {
            DB::table('center_memberships')->orderBy('id')->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    if ($row->user_id && $row->user_type) {
                        continue;
                    }

                    $userType = ($row->role ?? '') === CenterMembership::ROLE_STUDENT
                        ? Student::class
                        : Parents::class;
                    $status = in_array($row->status ?? 'active', ['active', CenterMembership::STATUS_ASSIGNED], true)
                        ? CenterMembership::STATUS_ASSIGNED
                        : CenterMembership::STATUS_NOT_ASSIGNED;

                    DB::table('center_memberships')->where('id', $row->id)->update([
                        'user_id' => (int) $row->profile_id,
                        'user_type' => $userType,
                        'status' => $status,
                    ]);
                }
            });
        }

        DB::table('center_memberships')->whereNull('user_id')->delete();

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        if (Schema::hasColumn('center_memberships', 'global_user_id')) {
            foreach ($this->foreignKeys('center_memberships') as $foreignKey) {
                if (str_contains($foreignKey, 'global_user')) {
                    DB::statement("ALTER TABLE center_memberships DROP FOREIGN KEY `{$foreignKey}`");
                }
            }

            Schema::table('center_memberships', function (Blueprint $table) {
                $columns = array_values(array_filter([
                    Schema::hasColumn('center_memberships', 'global_user_id') ? 'global_user_id' : null,
                    Schema::hasColumn('center_memberships', 'role') ? 'role' : null,
                    Schema::hasColumn('center_memberships', 'profile_id') ? 'profile_id' : null,
                ]));
                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        if (Schema::hasColumn('center_memberships', 'user_id')) {
            DB::statement('ALTER TABLE center_memberships MODIFY user_id BIGINT UNSIGNED NOT NULL');
        }
        if (Schema::hasColumn('center_memberships', 'user_type')) {
            DB::statement('ALTER TABLE center_memberships MODIFY user_type VARCHAR(255) NOT NULL');
        }
        if (Schema::hasColumn('center_memberships', 'status')) {
            DB::statement("ALTER TABLE center_memberships MODIFY status VARCHAR(16) NOT NULL DEFAULT 'assigned'");
        }

        Schema::table('center_memberships', function (Blueprint $table) {
            if (! $this->indexExists('center_memberships', 'center_memberships_center_user_unique')) {
                $table->unique(['center_id', 'user_id', 'user_type'], 'center_memberships_center_user_unique');
            }
            if (! $this->indexExists('center_memberships', 'center_memberships_center_type_user_idx')) {
                $table->index(['center_id', 'user_type', 'user_id'], 'center_memberships_center_type_user_idx');
            }
            if (! $this->indexExists('center_memberships', 'center_memberships_type_user_status_idx')) {
                $table->index(['user_type', 'user_id', 'status'], 'center_memberships_type_user_status_idx');
            }
        });

        $this->dropLegacyGlobalUserArtifacts();
    }

    protected function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();
        $result = DB::select(
            'SELECT COUNT(*) AS aggregate FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$database, $table, $index]
        );

        return (int) ($result[0]->aggregate ?? 0) > 0;
    }

    /** @return list<string> */
    protected function foreignKeys(string $table): array
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();
        $rows = DB::select(
            'SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL',
            [$database, $table]
        );

        return array_values(array_unique(array_map(fn ($row) => (string) $row->name, $rows)));
    }

    protected function dropLegacyGlobalUserArtifacts(): void
    {
        if (Schema::connection('center')->hasColumn('students', 'global_user_id')) {
            Schema::connection('center')->table('students', function (Blueprint $table) {
                $table->dropColumn('global_user_id');
            });
        }

        if (Schema::connection('center')->hasColumn('parents', 'global_user_id')) {
            Schema::connection('center')->table('parents', function (Blueprint $table) {
                $table->dropColumn('global_user_id');
            });
        }

        if (Schema::hasTable('global_users')) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            Schema::dropIfExists('global_users');
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    public function down(): void
    {
        // Irreversible without restoring global_users.
    }
};
