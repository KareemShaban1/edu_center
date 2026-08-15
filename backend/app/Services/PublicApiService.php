<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterContextManager;
use App\Models\Platform\Center;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class PublicApiService
{
    public function __construct(
        private readonly CenterContextManager $centerContext,
    ) {}

    /**
     * @return Collection<int, array{id: int, slug: string, name: string}>
     */
    public function centers(): Collection
    {
        return Center::query()
            ->orderBy('name')
            ->get(['id', 'slug', 'name'])
            ->map(fn ($center) => [
                'id' => $center->id,
                'slug' => $center->slug,
                'name' => $center->name,
            ])
            ->values();
    }

    /**
     * @return array{
     *   center: array{id: mixed, slug: mixed, name: mixed},
     *   grades: Collection,
     *   classes: Collection,
     *   sections: Collection
     * }|null
     */
    public function centerAcademic(string $slug): ?array
    {
        $center = Center::query()->where('slug', $slug)->first();
        if (! $center) {
            return null;
        }

        try {
            $this->centerContext->initialize($center);
            $db = DB::connection('center');
            $sch = Schema::connection('center');

            $grades = $sch->hasTable('grades')
                ? $db->table('grades')->orderBy('grade_name')->get(['id', 'grade_name'])
                    ->map(fn ($row) => [
                        'id' => (int) $row->id,
                        'name' => (string) $row->grade_name,
                    ])
                    ->values()
                : collect();

            $classes = $sch->hasTable('classes')
                ? $db->table('classes')->orderBy('class_name')->get(['id', 'class_name', 'grade_id'])
                    ->map(fn ($row) => [
                        'id' => (int) $row->id,
                        'name' => (string) $row->class_name,
                        'grade_id' => (int) $row->grade_id,
                    ])
                    ->values()
                : collect();

            $sections = $sch->hasTable('sections')
                ? $db->table('sections')->orderBy('section_name')->get(['id', 'section_name', 'class_id', 'grade_id'])
                    ->map(fn ($row) => [
                        'id' => (int) $row->id,
                        'name' => (string) $row->section_name,
                        'class_id' => (int) $row->class_id,
                        'grade_id' => isset($row->grade_id) ? (int) $row->grade_id : null,
                    ])
                    ->values()
                : collect();

            return [
                'center' => [
                    'id' => $center->id,
                    'slug' => $center->slug,
                    'name' => $center->name,
                ],
                'grades' => $grades,
                'classes' => $classes,
                'sections' => $sections,
            ];
        } finally {
            $this->centerContext->end();
        }
    }

    /**
     * @return array{centers: int, students: int, teachers: int}
     */
    public function stats(): array
    {
        $centersCount = (int) Center::query()->where('status', 1)->count();
        if ($centersCount === 0) {
            $centersCount = (int) Center::query()->count();
        }

        $centerDb = DB::connection('center');
        $hasTable = fn (string $table): bool => Schema::connection('center')->hasTable($table);
        $hasColumn = fn (string $table, string $column): bool => $hasTable($table)
            && Schema::connection('center')->hasColumn($table, $column);

        $studentsCount = 0;
        if ($hasTable('students')) {
            $studentsQuery = $centerDb->table('students');
            if ($hasColumn('students', 'deleted_at')) {
                $studentsQuery->whereNull('deleted_at');
            }
            $studentsCount = (int) $studentsQuery->count();
        }

        $teachersCount = $hasTable('teachers') ? (int) $centerDb->table('teachers')->count() : 0;

        return [
            'centers' => $centersCount,
            'students' => $studentsCount,
            'teachers' => $teachersCount,
        ];
    }
}
