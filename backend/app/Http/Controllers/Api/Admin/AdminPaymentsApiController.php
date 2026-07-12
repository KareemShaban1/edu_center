<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminPaymentsApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function sectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $feesHasFeeType = Schema::connection('center')->hasColumn('fees', 'fee_type');
        $feesHasLegacyType = Schema::connection('center')->hasColumn('fees', 'Fee_type');
        $feeTypeSelect = $feesHasFeeType
            ? 'fee_type as type'
            : ($feesHasLegacyType ? 'Fee_type as type' : DB::raw("'monthly' as type"));
        $mapFees = fn ($rows) => collect($rows)->map(fn ($f) => [
            'id' => (int) $f->id,
            'title' => $f->title,
            'amount' => (float) $f->amount,
            'month' => $f->month,
            'year' => $f->year,
            'type' => $f->type,
        ])->values();

        $feeSelect = ['id', 'title', 'amount', 'month', 'year', $feeTypeSelect];
        $fees = $mapFees(
            $tenantDb->table('fees')
                ->where('section_id', $section->id)
                ->select($feeSelect)
                ->get()
        );

        $requestedFeeId = $request->query('fee_id');
        $requestedFeeId = is_numeric($requestedFeeId) ? (int) $requestedFeeId : null;
        $selectedFee = $requestedFeeId
            ? $fees->first(fn ($f) => (int) $f['id'] === $requestedFeeId)
            : null;
        $effectiveFee = $selectedFee ?? $fees->first();

        $defaultFeeId = $effectiveFee['id'] ?? null;
        $defaultMonth = $effectiveFee['month'] ?? strtolower(now()->format('F'));
        $defaultAmount = $effectiveFee['amount'] ?? 0;

        $students = $tenantDb->table('students')
            ->where('section_id', $sectionId)
            ->whereNull('deleted_at')
            ->get(['id', 'name', 'grade_id', 'class_id', 'section_id']);

        $paymentsByStudent = $tenantDb->table('payments')
            ->where('section_id', $sectionId)
            ->when($defaultFeeId, fn ($q) => $q->where('fee_id', $defaultFeeId))
            ->when(!$defaultFeeId, fn ($q) => $q->whereDate('payment_date', $date))
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->get(['id', 'student_id', 'payment_date', 'fee_id', 'payment_status', 'month', 'amount', 'notes'])
            ->unique('student_id')
            ->keyBy('student_id');

        $rows = $students->map(function ($student) use ($paymentsByStudent, $defaultFeeId, $defaultMonth, $defaultAmount, $date) {
            $p = $paymentsByStudent->get($student->id);
            return [
                'id' => $p?->id ? (int) $p->id : null,
                'student_id' => (int) $student->id,
                'student_name' => $student->name,
                'payment_date' => $p?->payment_date ? \Illuminate\Support\Carbon::parse($p->payment_date)->toDateString() : $date,
                'fee_id' => $p?->fee_id ? (int) $p->fee_id : $defaultFeeId,
                'payment_status' => isset($p->payment_status) ? ((int) $p->payment_status === 1 ? 'paid' : 'unpaid') : 'unpaid',
                'month' => $p?->month ?? $defaultMonth,
                'amount' => isset($p->amount) ? (float) $p->amount : $defaultAmount,
                'notes' => $p?->notes ?? '',
            ];
        })->values();

        return response()->json([
            'date' => $date,
            'section' => [
                'id' => (int) $section->id,
                'grade_id' => (int) $section->grade_id,
                'class_id' => (int) $section->class_id,
            ],
            'fees' => $fees,
            'selected_fee_id' => $defaultFeeId,
            'rows' => $rows,
        ]);
    }

    public function postSectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.id' => ['nullable', 'integer'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.payment_date' => ['nullable', 'date_format:Y-m-d'],
            'rows.*.fee_id' => ['required', 'integer', 'exists:center.fees,id'],
            'rows.*.payment_status' => ['required', 'in:paid,unpaid'],
            'rows.*.month' => ['required', 'string', 'max:20'],
            'rows.*.amount' => ['nullable', 'numeric', 'min:0'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);

        $tenantDb = DB::connection('center');
        $students = $tenantDb->table('students')
            ->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())
            ->get(['id', 'grade_id', 'class_id', 'section_id'])
            ->keyBy('id');

        foreach ($payload['rows'] as $row) {
            $student = $students->get($row['student_id']);
            if (!$student || (int) $student->section_id !== $sectionId) continue;
            $rowPaymentDate = $row['payment_date'] ?? $date;
            $rowId = isset($row['id']) && is_numeric($row['id']) ? (int) $row['id'] : null;

            $exists = false;
            if ($rowId) {
                $exists = $tenantDb->table('payments')
                    ->where('id', $rowId)
                    ->where('section_id', $sectionId)
                    ->where('student_id', $row['student_id'])
                    ->exists();
            } else {
                $exists = $tenantDb->table('payments')
                    ->where('section_id', $sectionId)
                    ->where('student_id', $row['student_id'])
                    ->whereDate('payment_date', $rowPaymentDate)
                    ->where('fee_id', (int) $row['fee_id'])
                    ->exists();
            }

            $data = [
                'payment_date' => $rowPaymentDate,
                'student_id' => (int) $row['student_id'],
                'grade_id' => (int) $student->grade_id,
                'class_id' => (int) $student->class_id,
                'section_id' => (int) $student->section_id,
                'fee_id' => (int) $row['fee_id'],
                'payment_status' => $row['payment_status'] === 'paid' ? 1 : 0,
                'month' => $row['month'],
                'amount' => $row['amount'] ?? null,
                'notes' => $row['notes'] ?? null,
                'updated_at' => now(),
            ];

            if ($exists) {
                if ($rowId) {
                    $tenantDb->table('payments')
                        ->where('id', $rowId)
                        ->where('section_id', $sectionId)
                        ->where('student_id', $row['student_id'])
                        ->update($data);
                } else {
                    $tenantDb->table('payments')
                        ->where('section_id', $sectionId)
                        ->where('student_id', $row['student_id'])
                        ->whereDate('payment_date', $rowPaymentDate)
                        ->where('fee_id', (int) $row['fee_id'])
                        ->update($data);
                }
            } else {
                $data['created_at'] = now();
                $tenantDb->table('payments')->insert($data);
            }
        }

        return response()->json(['message' => 'Payments saved']);
    }

    public function sectionHistory(Request $request, int $sectionId): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $days = DB::connection('center')->table('payments')
            ->where('section_id', $sectionId)
            ->select(
                DB::raw('DATE(payment_date) as date'),
                DB::raw('SUM(CASE WHEN payment_status = 1 THEN 1 ELSE 0 END) as paid'),
                DB::raw('SUM(CASE WHEN payment_status = 0 THEN 1 ELSE 0 END) as unpaid'),
                DB::raw('SUM(COALESCE(amount,0)) as total_amount'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy(DB::raw('DATE(payment_date)'))
            ->orderByDesc(DB::raw('DATE(payment_date)'))
            ->get()
            ->map(fn ($d) => [
                'date' => $d->date,
                'paid' => (int) $d->paid,
                'unpaid' => (int) $d->unpaid,
                'total_amount' => (float) $d->total_amount,
                'total' => (int) $d->total,
            ])
            ->values();

        return response()->json(['days' => $days]);
    }

}
