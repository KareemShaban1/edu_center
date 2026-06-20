<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::connection('center')->hasColumn('students', 'code')) {
            return;
        }

        Schema::connection('center')->table('students', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->unique()->after('email');
        });

        DB::connection('center')->table('students')
            ->whereNull('code')
            ->orderBy('id')
            ->get()
            ->each(function (object $student): void {
                DB::connection('center')->table('students')
                    ->where('id', $student->id)
                    ->update(['code' => 'STU-'.str_pad((string) $student->id, 6, '0', STR_PAD_LEFT)]);
            });

        DB::connection('center')->statement('ALTER TABLE students MODIFY code VARCHAR(50) NOT NULL');
    }

    public function down(): void
    {
        Schema::connection('center')->table('students', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};
