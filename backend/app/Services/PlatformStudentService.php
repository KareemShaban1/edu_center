<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Student;
use App\Repositories\PlatformMembershipRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class PlatformStudentService
{
    public function __construct(
        private readonly PlatformMembershipRepository $membershipRepository,
    ) {}

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(string $conn): Collection
    {
        if (! Schema::connection($conn)->hasTable('students')) {
            return collect();
        }

        $hasDeletedAt = Schema::connection($conn)->hasColumn('students', 'deleted_at');
        $hasPhone = Schema::connection($conn)->hasColumn('students', 'phone');
        $hasIsActive = Schema::connection($conn)->hasColumn('students', 'is_active');

        $query = DB::connection($conn)->table('students')->orderByDesc('id');
        if ($hasDeletedAt) {
            $query->whereNull('deleted_at');
        }

        $parentNames = Schema::connection($conn)->hasTable('parents')
            ? DB::connection($conn)->table('parents')->pluck('parent_name', 'id')
            : collect();

        $membershipsByUser = $this->membershipRepository->membershipsByUser($conn, Student::class);

        return $query->get()->map(function ($row) use ($hasPhone, $hasIsActive, $parentNames, $membershipsByUser) {
            $centers = $membershipsByUser->get((int) $row->id, collect());

            return [
                'id' => (int) $row->id,
                'name' => $row->name,
                'code' => $row->code ?? null,
                'email' => $row->email,
                'phone' => $hasPhone ? ($row->phone ?? null) : null,
                'gender' => $row->gender ?? null,
                'grade_id' => isset($row->grade_id) ? (int) $row->grade_id : null,
                'class_id' => isset($row->class_id) ? (int) $row->class_id : null,
                'section_id' => isset($row->section_id) ? (int) $row->section_id : null,
                'parent_id' => isset($row->parent_id) ? (int) $row->parent_id : null,
                'parent_name' => isset($row->parent_id) ? ($parentNames[(int) $row->parent_id] ?? null) : null,
                'academic_year' => $row->academic_year ?? null,
                'notes' => $row->notes ?? null,
                'status' => $hasIsActive
                    ? ((int) ($row->is_active ?? 1) === 1 ? 'active' : 'inactive')
                    : 'active',
                'centers' => $centers->values()->all(),
                'centers_count' => $centers->count(),
                'centers_label' => $centers->pluck('name')->filter()->implode(', ') ?: '—',
                'created_at' => optional($row->created_at)->format('Y-m-d') ?? null,
                'updated_at' => optional($row->updated_at)->format('Y-m-d H:i') ?? null,
            ];
        })->values();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function show(string $conn, int $id): ?array
    {
        if (! Schema::connection($conn)->hasTable('students')) {
            return null;
        }

        $query = DB::connection($conn)->table('students')->where('id', $id);
        if (Schema::connection($conn)->hasColumn('students', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $row = $query->first();
        if (! $row) {
            return null;
        }

        $parent = null;
        if (! empty($row->parent_id) && Schema::connection($conn)->hasTable('parents')) {
            $parentRow = DB::connection($conn)->table('parents')->where('id', $row->parent_id)->first();
            if ($parentRow) {
                $parent = [
                    'id' => (int) $parentRow->id,
                    'name' => $parentRow->parent_name,
                    'email' => $parentRow->email,
                    'phone' => $parentRow->parent_phone ?? null,
                ];
            }
        }

        $centers = $this->membershipRepository->membershipsByUser($conn, Student::class)->get($id, collect())->values()->all();

        return [
            'id' => (int) $row->id,
            'name' => $row->name,
            'code' => $row->code ?? null,
            'email' => $row->email,
            'phone' => $row->phone ?? null,
            'gender' => $row->gender ?? null,
            'grade_id' => isset($row->grade_id) ? (int) $row->grade_id : null,
            'class_id' => isset($row->class_id) ? (int) $row->class_id : null,
            'section_id' => isset($row->section_id) ? (int) $row->section_id : null,
            'parent_id' => isset($row->parent_id) ? (int) $row->parent_id : null,
            'parent' => $parent,
            'parent_name' => $parent['name'] ?? null,
            'academic_year' => $row->academic_year ?? null,
            'notes' => $row->notes ?? null,
            'status' => Schema::connection($conn)->hasColumn('students', 'is_active')
                ? ((int) ($row->is_active ?? 1) === 1 ? 'active' : 'inactive')
                : 'active',
            'centers' => $centers,
            'centers_count' => count($centers),
            'centers_label' => collect($centers)->pluck('name')->filter()->implode(', ') ?: '—',
            'created_at' => optional($row->created_at)->format('Y-m-d') ?? null,
            'updated_at' => optional($row->updated_at)->format('Y-m-d H:i') ?? null,
        ];
    }
}
