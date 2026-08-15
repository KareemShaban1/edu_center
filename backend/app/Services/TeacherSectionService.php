<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class TeacherSectionService
{
    public function sectionIds(Connection $tenantDb, int $teacherId): Collection
    {
        $sectionIds = collect();

        if (Schema::connection('center')->hasTable('sections') && Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('sections')->where('teacher_id', $teacherId)->pluck('id')
            );
        }

        if (Schema::connection('center')->hasTable('teacher_section')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('teacher_section')->where('teacher_id', $teacherId)->pluck('section_id')
            );
        }

        return $sectionIds->unique()->values();
    }
}
