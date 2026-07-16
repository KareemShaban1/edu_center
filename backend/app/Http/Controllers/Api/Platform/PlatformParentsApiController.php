<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use App\Models\Parents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlatformParentsApiController extends Controller
{
    use ResolvesPlatformApiContext;

    public function index(Request $request): JsonResponse
    {
        $ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }

        $conn = $ctx['centralConnection'];
        if (! Schema::connection($conn)->hasTable('parents')) {
            return response()->json([]);
        }

        $hasIsActive = Schema::connection($conn)->hasColumn('parents', 'is_active');
        $membershipsByUser = $this->membershipsByUser($conn, Parents::class);
        $childrenCounts = $this->childrenCounts($conn);

        $parents = DB::connection($conn)->table('parents')
            ->orderByDesc('id')
            ->get()
            ->map(function ($row) use ($hasIsActive, $membershipsByUser, $childrenCounts) {
                $centers = $membershipsByUser->get((int) $row->id, collect());
                $childrenCount = (int) ($childrenCounts[(int) $row->id] ?? 0);

                return [
                    'id' => (int) $row->id,
                    'name' => $row->parent_name,
                    'email' => $row->email,
                    'phone' => $row->parent_phone ?? null,
                    'job' => $row->parent_job ?? null,
                    'address' => $row->parent_address ?? null,
                    'notes' => $row->notes ?? null,
                    'children_count' => $childrenCount,
                    'status' => $hasIsActive
                        ? ((int) ($row->is_active ?? 1) === 1 ? 'active' : 'inactive')
                        : 'active',
                    'centers' => $centers->values()->all(),
                    'centers_count' => $centers->count(),
                    'centers_label' => $centers->pluck('name')->filter()->implode(', ') ?: '—',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? null,
                    'updated_at' => optional($row->updated_at)->format('Y-m-d H:i') ?? null,
                ];
            })
            ->values();

        return response()->json($parents);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }

        $conn = $ctx['centralConnection'];
        if (! Schema::connection($conn)->hasTable('parents')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $row = DB::connection($conn)->table('parents')->where('id', $id)->first();
        if (! $row) {
            return response()->json(['message' => 'Parent not found'], 404);
        }

        $children = [];
        if (Schema::connection($conn)->hasTable('students')) {
            $studentsQuery = DB::connection($conn)->table('students')->where('parent_id', $id);
            if (Schema::connection($conn)->hasColumn('students', 'deleted_at')) {
                $studentsQuery->whereNull('deleted_at');
            }
            $children = $studentsQuery
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'email', 'is_active'])
                ->map(fn ($student) => [
                    'id' => (int) $student->id,
                    'name' => $student->name,
                    'code' => $student->code ?? null,
                    'email' => $student->email,
                    'status' => isset($student->is_active)
                        ? ((int) $student->is_active === 1 ? 'active' : 'inactive')
                        : 'active',
                ])
                ->values()
                ->all();
        }

        $centers = $this->membershipsByUser($conn, Parents::class)->get($id, collect())->values()->all();

        return response()->json([
            'id' => (int) $row->id,
            'name' => $row->parent_name,
            'email' => $row->email,
            'phone' => $row->parent_phone ?? null,
            'job' => $row->parent_job ?? null,
            'address' => $row->parent_address ?? null,
            'notes' => $row->notes ?? null,
            'children' => $children,
            'children_count' => count($children),
            'status' => Schema::connection($conn)->hasColumn('parents', 'is_active')
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

    /** @return array<int, int> */
    private function childrenCounts(string $conn): array
    {
        if (! Schema::connection($conn)->hasTable('students')) {
            return [];
        }

        $query = DB::connection($conn)->table('students')
            ->whereNotNull('parent_id')
            ->select('parent_id', DB::raw('COUNT(*) as total'))
            ->groupBy('parent_id');

        if (Schema::connection($conn)->hasColumn('students', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        return $query->pluck('total', 'parent_id')
            ->map(fn ($total) => (int) $total)
            ->all();
    }
}
