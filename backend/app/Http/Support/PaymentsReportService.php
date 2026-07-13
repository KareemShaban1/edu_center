<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Database\Connection;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class PaymentsReportService
{
    public function __construct(
        private readonly MonthlyUnpaidStudentsService $unpaidStudentsService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(Request $request, Connection $tenantDb): array
    {
        $filters = $this->resolveFilters($request);
        $hasTable = fn (string $table) => Schema::connection('center')->hasTable($table);
        $hasColumn = fn (string $table, string $column) => Schema::connection('center')->hasTable($table)
            && Schema::connection('center')->hasColumn($table, $column);

        if (! $hasTable('payments')) {
            return $this->emptyReport($filters);
        }

        $feeTypeExpr = $hasTable('fees')
            ? ($hasColumn('fees', 'fee_type')
                ? 'fees.fee_type'
                : ($hasColumn('fees', 'Fee_type') ? 'fees.Fee_type' : "'other'"))
            : "'other'";

        $stats = $this->buildStats($tenantDb, $filters);
        $byFeeType = $this->buildByFeeType($tenantDb, $filters, $feeTypeExpr);
        $byMonth = $this->buildByMonth($tenantDb, $filters);
        $paidVsUnpaid = $this->buildPaidVsUnpaid($tenantDb, $filters);
        $recent = $this->buildRecent($tenantDb, $filters);
        $unpaidPayload = $this->buildUnpaidStudents($tenantDb, $filters);

        return [
            'type' => 'payments',
            'stats' => $stats,
            'by_fee_type' => $byFeeType,
            'by_month' => $byMonth,
            'paid_vs_unpaid' => $paidVsUnpaid,
            'by_grade' => $byFeeType->map(fn ($row) => [
                'grade_name' => $row['label'],
                'total' => $row['total'],
                'rate' => $row['collected'],
            ])->values(),
            'recent' => $recent,
            'unpaid_students' => $unpaidPayload['items'],
            'unpaid_mode' => $unpaidPayload['mode'],
            'reference_month' => $unpaidPayload['reference_month'] ?? null,
            'filters' => $filters,
        ];
    }

    /**
     * @return array{grade_id?: int, class_id?: int, section_id?: int, date?: string}
     */
    private function resolveFilters(Request $request): array
    {
        $filters = [];

        foreach (['grade_id', 'class_id', 'section_id'] as $key) {
            $value = $request->query($key);
            if (is_numeric($value) && (int) $value > 0) {
                $filters[$key] = (int) $value;
            }
        }

        $date = $request->query('date');
        if (is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', trim($date))) {
            $filters['date'] = trim($date);
        }

        return $filters;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array{key: string, value: float|int}>
     */
    private function buildStats(Connection $tenantDb, array $filters): array
    {
        $query = $this->scopedPaymentsQuery($tenantDb, $filters, applyDate: true);

        $paymentsCount = (int) (clone $query)->count('payments.id');
        $collectedAmount = (float) ((clone $query)->where('payments.payment_status', 1)->sum('payments.amount') ?? 0);
        $unpaidCount = (int) (clone $query)->where('payments.payment_status', 0)->count('payments.id');
        $unpaidAmount = (float) ((clone $query)->where('payments.payment_status', 0)->sum('payments.amount') ?? 0);

        $feesTotal = 0.0;
        if (Schema::connection('center')->hasTable('fees')) {
            $feesQuery = $tenantDb->table('fees');
            $this->applyAcademicFilters($feesQuery, $filters, 'fees');
            $feesTotal = (float) ($feesQuery->sum('amount') ?? 0);
        }

        return [
            ['key' => 'collected_amount', 'value' => round($collectedAmount, 2)],
            ['key' => 'payments_count', 'value' => $paymentsCount],
            ['key' => 'unpaid_count', 'value' => $unpaidCount],
            ['key' => 'unpaid_amount', 'value' => round($unpaidAmount, 2)],
            ['key' => 'fees_total', 'value' => round($feesTotal, 2)],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function buildByFeeType(Connection $tenantDb, array $filters, string $feeTypeExpr): Collection
    {
        if (! Schema::connection('center')->hasTable('fees')) {
            return collect();
        }

        return $this->scopedPaymentsQuery($tenantDb, $filters, applyDate: true)
            ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
            ->select(
                DB::raw("$feeTypeExpr as type"),
                DB::raw('SUM(CASE WHEN payments.payment_status = 1 THEN COALESCE(payments.amount,0) ELSE 0 END) as collected'),
                DB::raw('SUM(CASE WHEN payments.payment_status = 0 THEN COALESCE(payments.amount,0) ELSE 0 END) as unpaid'),
                DB::raw('COUNT(payments.id) as total')
            )
            ->groupBy(DB::raw($feeTypeExpr))
            ->get()
            ->map(fn ($row) => [
                'type' => (string) ($row->type ?: 'other'),
                'label' => ucfirst(str_replace('_', ' ', (string) ($row->type ?: 'other'))),
                'collected' => round((float) $row->collected, 2),
                'unpaid' => round((float) $row->unpaid, 2),
                'total' => (int) $row->total,
            ])
            ->sortByDesc('collected')
            ->values();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function buildByMonth(Connection $tenantDb, array $filters): Collection
    {
        $query = $this->scopedPaymentsQuery($tenantDb, $filters, applyDate: false);

        if (! empty($filters['date'])) {
            $reference = Carbon::parse($filters['date'])->startOfMonth();
            $query->whereYear('payments.payment_date', $reference->year)
                ->whereMonth('payments.payment_date', $reference->month);
        } else {
            $query->where('payments.payment_date', '>=', now()->subMonths(11)->startOfMonth()->toDateString());
        }

        return $query
            ->select(
                DB::raw("DATE_FORMAT(payments.payment_date, '%Y-%m') as month"),
                DB::raw('SUM(CASE WHEN payments.payment_status = 1 THEN COALESCE(payments.amount,0) ELSE 0 END) as collected'),
                DB::raw('SUM(CASE WHEN payments.payment_status = 0 THEN COALESCE(payments.amount,0) ELSE 0 END) as unpaid')
            )
            ->groupBy(DB::raw("DATE_FORMAT(payments.payment_date, '%Y-%m')"))
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => (string) $row->month,
                'collected' => round((float) $row->collected, 2),
                'unpaid' => round((float) $row->unpaid, 2),
            ])
            ->values();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{paid_count: int, unpaid_count: int, paid_amount: float, unpaid_amount: float}
     */
    private function buildPaidVsUnpaid(Connection $tenantDb, array $filters): array
    {
        $query = $this->scopedPaymentsQuery($tenantDb, $filters, applyDate: true);

        return [
            'paid_count' => (int) (clone $query)->where('payments.payment_status', 1)->count('payments.id'),
            'unpaid_count' => (int) (clone $query)->where('payments.payment_status', 0)->count('payments.id'),
            'paid_amount' => round((float) ((clone $query)->where('payments.payment_status', 1)->sum('payments.amount') ?? 0), 2),
            'unpaid_amount' => round((float) ((clone $query)->where('payments.payment_status', 0)->sum('payments.amount') ?? 0), 2),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function buildRecent(Connection $tenantDb, array $filters): Collection
    {
        if (! Schema::connection('center')->hasTable('students')) {
            return collect();
        }

        return $this->scopedPaymentsQuery($tenantDb, $filters, applyDate: true)
            ->select(
                'payments.id',
                'students.name as student_name',
                'grades.grade_name',
                'classes.class_name',
                'sections.section_name',
                'payments.payment_date as date',
                'payments.amount',
                'payments.payment_status as status',
                'payments.month'
            )
            ->orderByDesc('payments.payment_date')
            ->orderByDesc('payments.id')
            ->limit(50)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'student_name' => $row->student_name ?: '—',
                'grade_name' => $row->grade_name ?: '—',
                'class_name' => $row->class_name ?: '—',
                'section_name' => $row->section_name ?: '—',
                'date' => $row->date,
                'degree' => $row->amount !== null ? number_format((float) $row->amount, 2) : '—',
                'status' => (int) $row->status === 1 ? 'paid' : 'unpaid',
            ])
            ->values();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{mode: string, reference_month?: string, items: Collection}
     */
    private function buildUnpaidStudents(Connection $tenantDb, array $filters): array
    {
        if (! empty($filters['date'])) {
            $reference = Carbon::parse($filters['date'])->startOfMonth();
            $summary = $this->unpaidStudentsService->summarize($tenantDb, $reference, $filters);

            $items = $summary['items']->map(fn ($item) => [
                'id' => $item['id'],
                'student_name' => $item['title'],
                'grade_name' => $item['grade_name'] ?? '—',
                'class_name' => $item['class_name'] ?? '—',
                'section_name' => $item['section_name'] ?? '—',
                'fee_title' => $item['fee_title'] ?? null,
                'deserved_months' => [$summary['month']],
                'unpaid_amount' => $this->parseAmountMeta($item['meta'] ?? '0'),
            ])->values();

            return [
                'mode' => 'date',
                'reference_month' => $summary['month'],
                'items' => $items,
            ];
        }

        return [
            'mode' => 'deserved_months',
            'items' => collect($this->listUnpaidWithDeservedMonths($tenantDb, $filters)),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function listUnpaidWithDeservedMonths(Connection $tenantDb, array $filters): array
    {
        if (! Schema::connection('center')->hasTable('fees')
            || ! Schema::connection('center')->hasTable('students')) {
            return [];
        }

        $sectionIds = $this->resolveSectionIdsInScope($tenantDb, $filters);
        if ($sectionIds->isEmpty()) {
            return [];
        }

        $studentsHasDeletedAt = Schema::connection('center')->hasColumn('students', 'deleted_at');
        $studentsQuery = $tenantDb->table('students')->whereIn('section_id', $sectionIds->all());
        if ($studentsHasDeletedAt) {
            $studentsQuery->whereNull('deleted_at');
        }
        $students = $studentsQuery->get(['id', 'name', 'grade_id', 'class_id', 'section_id']);
        if ($students->isEmpty()) {
            return [];
        }

        $feeColumns = ['id', 'title', 'amount', 'grade_id', 'class_id', 'section_id', 'month'];
        if (Schema::connection('center')->hasColumn('fees', 'year')) {
            $feeColumns[] = 'year';
        }

        $feesQuery = $tenantDb->table('fees')->whereIn('section_id', $sectionIds->all());
        $this->applyAcademicFilters($feesQuery, $filters, 'fees');
        $fees = $feesQuery->get($feeColumns);
        if ($fees->isEmpty()) {
            return [];
        }

        $paymentsByKey = collect();
        if (Schema::connection('center')->hasTable('payments')) {
            $paymentsByKey = $tenantDb->table('payments')
                ->whereIn('student_id', $students->pluck('id')->all())
                ->whereIn('fee_id', $fees->pluck('id')->all())
                ->orderByDesc('payment_date')
                ->orderByDesc('id')
                ->get(['student_id', 'fee_id', 'payment_status', 'amount'])
                ->unique(fn ($row) => $row->student_id.'-'.$row->fee_id)
                ->keyBy(fn ($row) => $row->student_id.'-'.$row->fee_id);
        }

        $academicMaps = $this->loadAcademicNameMaps($tenantDb);
        $studentMap = [];

        foreach ($fees as $fee) {
            $sectionStudents = $students->where('section_id', (int) $fee->section_id);
            foreach ($sectionStudents as $student) {
                $paymentKey = $student->id.'-'.$fee->id;
                $payment = $paymentsByKey->get($paymentKey);

                if ($this->isPaymentPaid($payment)) {
                    continue;
                }

                $amount = ($payment && $payment->amount !== null)
                    ? (float) $payment->amount
                    : (float) $fee->amount;
                $monthLabel = $this->formatFeeMonth($fee);

                $studentId = (int) $student->id;
                if (! isset($studentMap[$studentId])) {
                    [$gradeName, $className, $sectionName] = $this->resolveAcademicNames(
                        (int) $student->grade_id,
                        (int) $student->class_id,
                        (int) $student->section_id,
                        $academicMaps,
                    );

                    $studentMap[$studentId] = [
                        'id' => $studentId,
                        'student_name' => (string) $student->name,
                        'grade_name' => $gradeName,
                        'class_name' => $className,
                        'section_name' => $sectionName,
                        'deserved_months' => [],
                        'unpaid_amount' => 0.0,
                    ];
                }

                $studentMap[$studentId]['deserved_months'][] = $monthLabel;
                $studentMap[$studentId]['unpaid_amount'] += $amount;
            }
        }

        return collect($studentMap)
            ->map(function (array $row) {
                $row['deserved_months'] = array_values(array_unique($row['deserved_months']));
                sort($row['deserved_months']);
                $row['unpaid_amount'] = round($row['unpaid_amount'], 2);

                return $row;
            })
            ->sortBy('student_name')
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function scopedPaymentsQuery(Connection $tenantDb, array $filters, bool $applyDate)
    {
        $query = $tenantDb->table('payments')
            ->leftJoin('students', 'payments.student_id', '=', 'students.id')
            ->leftJoin('grades', 'payments.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'payments.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'payments.section_id', '=', 'sections.id');

        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $query->whereNull('students.deleted_at');
        }

        $this->applyAcademicFilters($query, $filters, 'payments');

        if ($applyDate && ! empty($filters['date'])) {
            $query->whereDate('payments.payment_date', $filters['date']);
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyAcademicFilters($query, array $filters, string $prefix): void
    {
        if (! empty($filters['grade_id'])) {
            $query->where("$prefix.grade_id", (int) $filters['grade_id']);
        }
        if (! empty($filters['class_id'])) {
            $query->where("$prefix.class_id", (int) $filters['class_id']);
        }
        if (! empty($filters['section_id'])) {
            $query->where("$prefix.section_id", (int) $filters['section_id']);
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function resolveSectionIdsInScope(Connection $tenantDb, array $filters): Collection
    {
        if (! Schema::connection('center')->hasTable('sections')) {
            return collect();
        }

        $query = $tenantDb->table('sections')->select('id');

        if (! empty($filters['section_id'])) {
            $query->where('id', (int) $filters['section_id']);
        } elseif (! empty($filters['class_id']) && Schema::connection('center')->hasColumn('sections', 'class_id')) {
            $query->where('class_id', (int) $filters['class_id']);
        } elseif (! empty($filters['grade_id']) && Schema::connection('center')->hasColumn('sections', 'grade_id')) {
            $query->where('grade_id', (int) $filters['grade_id']);
        }

        return $query->pluck('id');
    }

    private function loadAcademicNameMaps(Connection $tenantDb): array
    {
        return [
            'grades' => Schema::connection('center')->hasTable('grades')
                ? $tenantDb->table('grades')->pluck('grade_name', 'id')
                : collect(),
            'classes' => Schema::connection('center')->hasTable('classes')
                ? $tenantDb->table('classes')->pluck('class_name', 'id')
                : collect(),
            'sections' => Schema::connection('center')->hasTable('sections')
                ? $tenantDb->table('sections')->pluck('section_name', 'id')
                : collect(),
        ];
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function resolveAcademicNames(int $gradeId, int $classId, int $sectionId, array $maps): array
    {
        $gradeName = $maps['grades']->has($gradeId)
            ? (string) $maps['grades']->get($gradeId)
            : ($gradeId > 0 ? 'Grade '.$gradeId : '—');
        $className = $maps['classes']->has($classId)
            ? (string) $maps['classes']->get($classId)
            : ($classId > 0 ? 'Class '.$classId : '—');
        $sectionName = $maps['sections']->has($sectionId)
            ? (string) $maps['sections']->get($sectionId)
            : ($sectionId > 0 ? 'Section '.$sectionId : '—');

        return [$gradeName, $className, $sectionName];
    }

    private function formatFeeMonth(object $fee): string
    {
        $month = trim((string) ($fee->month ?? ''));
        $year = isset($fee->year) ? trim((string) $fee->year) : '';

        if ($month !== '' && $year !== '') {
            return $month.' '.$year;
        }

        return $month !== '' ? $month : '—';
    }

    private function isPaymentPaid(mixed $payment): bool
    {
        if (! $payment) {
            return false;
        }

        $status = $payment->payment_status;

        if (is_bool($status)) {
            return $status;
        }

        if (is_numeric($status)) {
            return (int) $status === 1;
        }

        $raw = strtolower(trim((string) $status));

        return in_array($raw, ['1', 'true', 'paid', 'yes'], true);
    }

    private function parseAmountMeta(string $meta): float
    {
        $normalized = str_replace(',', '', trim($meta));

        return is_numeric($normalized) ? round((float) $normalized, 2) : 0.0;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function emptyReport(array $filters): array
    {
        return [
            'type' => 'payments',
            'stats' => [
                ['key' => 'collected_amount', 'value' => 0],
                ['key' => 'payments_count', 'value' => 0],
                ['key' => 'unpaid_count', 'value' => 0],
                ['key' => 'unpaid_amount', 'value' => 0],
                ['key' => 'fees_total', 'value' => 0],
            ],
            'by_fee_type' => [],
            'by_month' => [],
            'paid_vs_unpaid' => [
                'paid_count' => 0,
                'unpaid_count' => 0,
                'paid_amount' => 0,
                'unpaid_amount' => 0,
            ],
            'by_grade' => [],
            'recent' => [],
            'unpaid_students' => [],
            'unpaid_mode' => ! empty($filters['date']) ? 'date' : 'deserved_months',
            'reference_month' => null,
            'filters' => $filters,
        ];
    }
}
