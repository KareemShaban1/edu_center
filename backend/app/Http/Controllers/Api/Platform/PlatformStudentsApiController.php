<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Models\Parents;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlatformStudentsApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function index(Request $request): JsonResponse
    {
        $ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }

        $conn = $ctx['centralConnection'];
        if (! Schema::connection($conn)->hasTable('students')) {
            return response()->json([]);
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

        $membershipsByUser = $this->membershipsByUser($conn, Student::class);

        $students = $query->get()->map(function ($row) use ($hasPhone, $hasIsActive, $parentNames, $membershipsByUser) {
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

        return response()->json($students);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }

        $conn = $ctx['centralConnection'];
        if (! Schema::connection($conn)->hasTable('students')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $query = DB::connection($conn)->table('students')->where('id', $id);
        if (Schema::connection($conn)->hasColumn('students', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $row = $query->first();
        if (! $row) {
            return response()->json(['message' => 'Student not found'], 404);
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

        $centers = $this->membershipsByUser($conn, Student::class)->get($id, collect())->values()->all();

        return response()->json([
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
        ]);
    }

    /** @return Collection<int, Collection<int, array{id: int, name: string, slug: string|null, status: string}>> */
    private function membershipsByUser(string $conn, string $userType): Collection
    {
        if (! Schema::connection($conn)->hasTable('center_memberships')
            || ! Schema::connection($conn)->hasTable('centers')) {
            return collect();
        }

        return DB::connection($conn)->table('center_memberships as cm')
            ->leftJoin('centers', 'centers.id', '=', 'cm.center_id')
            ->where('cm.user_type', $userType)
            ->orderBy('centers.name')
            ->get([
                'cm.user_id',
                'cm.status',
                'centers.id as center_id',
                'centers.name as center_name',
                'centers.slug as center_slug',
            ])
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows->map(fn ($row) => [
                'id' => (int) ($row->center_id ?? 0),
                'name' => (string) ($row->center_name ?: '—'),
                'slug' => $row->center_slug,
                'status' => (string) ($row->status ?: 'assigned'),
            ])->values());
    }
}
