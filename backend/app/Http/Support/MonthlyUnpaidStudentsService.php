<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Database\Connection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class MonthlyUnpaidStudentsService
{
    /**
     * @return array{
     *     month: string,
     *     items: Collection,
     *     expected_students: int,
     *     paid_count: int,
     *     unpaid_count: int,
     *     unpaid_amount: float
     * }
     */
    public function summarize(Connection $tenantDb, ?Carbon $reference = null, array $filters = []): array
    {
        $now = ($reference ?? now())->copy()->startOfMonth();
        $monthLabel = $now->format('F Y');
        $monthTokens = $this->monthTokens($now);

        if (! Schema::connection('tenant')->hasTable('fees')
            || ! Schema::connection('tenant')->hasTable('students')) {
            return $this->emptyResult($monthLabel);
        }

        $hasPayments = Schema::connection('tenant')->hasTable('payments');
        $studentsHasDeletedAt = Schema::connection('tenant')->hasColumn('students', 'deleted_at');

        $fees = $this->resolveMonthFees($tenantDb, $now, $monthTokens, $hasPayments);
        $academicMaps = $this->loadAcademicNameMaps($tenantDb);

        $unpaidList = collect();
        $paidCount = 0;
        $unpaidCount = 0;
        $unpaidAmount = 0.0;
        $expectedStudents = 0;
        $seenKeys = [];

        foreach ($fees as $fee) {
            if (! $this->matchesAcademicFilters(
                isset($fee->grade_id) ? (int) $fee->grade_id : null,
                isset($fee->class_id) ? (int) $fee->class_id : null,
                (int) $fee->section_id,
                $filters,
            )) {
                continue;
            }

            $studentsQuery = $tenantDb->table('students')->where('section_id', $fee->section_id);
            if ($studentsHasDeletedAt) {
                $studentsQuery->whereNull('deleted_at');
            }

            $students = $studentsQuery->get(['id', 'name']);
            if ($students->isEmpty()) {
                continue;
            }

            $paymentsByStudent = collect();
            if ($hasPayments) {
                $paymentsByStudent = $tenantDb->table('payments')
                    ->where('fee_id', $fee->id)
                    ->where('section_id', $fee->section_id)
                    ->whereIn('student_id', $students->pluck('id')->all())
                    ->orderByDesc('payment_date')
                    ->orderByDesc('id')
                    ->get(['student_id', 'payment_status', 'amount'])
                    ->unique('student_id')
                    ->keyBy('student_id');
            }

            $feeAmount = (float) $fee->amount;
            [$gradeName, $className, $sectionName] = $this->resolveAcademicNames(
                isset($fee->grade_id) ? (int) $fee->grade_id : null,
                isset($fee->class_id) ? (int) $fee->class_id : null,
                (int) $fee->section_id,
                $academicMaps,
            );

            foreach ($students as $student) {
                $this->registerStudentFeeStatus(
                    studentId: (int) $student->id,
                    studentName: (string) $student->name,
                    feeId: (int) $fee->id,
                    feeTitle: (string) $fee->title,
                    gradeId: isset($fee->grade_id) ? (int) $fee->grade_id : null,
                    classId: isset($fee->class_id) ? (int) $fee->class_id : null,
                    sectionId: (int) $fee->section_id,
                    gradeName: $gradeName,
                    className: $className,
                    sectionName: $sectionName,
                    feeAmount: $feeAmount,
                    payment: $paymentsByStudent->get($student->id),
                    seenKeys: $seenKeys,
                    unpaidList: $unpaidList,
                    paidCount: $paidCount,
                    unpaidCount: $unpaidCount,
                    unpaidAmount: $unpaidAmount,
                    expectedStudents: $expectedStudents,
                );
            }
        }

        if ($hasPayments) {
            $this->appendDirectUnpaidPayments(
                tenantDb: $tenantDb,
                now: $now,
                monthTokens: $monthTokens,
                academicMaps: $academicMaps,
                filters: $filters,
                studentsHasDeletedAt: $studentsHasDeletedAt,
                seenKeys: $seenKeys,
                unpaidList: $unpaidList,
                paidCount: $paidCount,
                unpaidCount: $unpaidCount,
                unpaidAmount: $unpaidAmount,
                expectedStudents: $expectedStudents,
            );
        }

        return [
            'month' => $monthLabel,
            'items' => $unpaidList->sortBy('title')->values()->take(100),
            'expected_students' => $expectedStudents,
            'paid_count' => $paidCount,
            'unpaid_count' => $unpaidCount,
            'unpaid_amount' => round($unpaidAmount, 2),
        ];
    }

    private function resolveMonthFees(Connection $tenantDb, Carbon $now, array $monthTokens, bool $hasPayments): Collection
    {
        $feeColumns = ['id', 'title', 'amount', 'grade_id', 'class_id', 'section_id', 'month'];
        if (Schema::connection('tenant')->hasColumn('fees', 'year')) {
            $feeColumns[] = 'year';
        }

        $feesQuery = $tenantDb->table('fees');
        $this->applyFlexibleMonthFilter($feesQuery, 'month', $monthTokens);
        $fees = $feesQuery->get($feeColumns);

        if ($fees->isNotEmpty()) {
            return $fees;
        }

        if (! $hasPayments) {
            return collect();
        }

        $feeIds = $tenantDb->table('payments')
            ->whereYear('payment_date', $now->year)
            ->whereMonth('payment_date', $now->month)
            ->pluck('fee_id')
            ->unique()
            ->filter()
            ->values();

        if ($feeIds->isEmpty()) {
            $paymentsQuery = $tenantDb->table('payments');
            $this->applyFlexibleMonthFilter($paymentsQuery, 'month', $monthTokens);
            $feeIds = $paymentsQuery
                ->pluck('fee_id')
                ->unique()
                ->filter()
                ->values();
        }

        if ($feeIds->isEmpty()) {
            return collect();
        }

        return $tenantDb->table('fees')
            ->whereIn('id', $feeIds->all())
            ->get($feeColumns);
    }

    private function applyFlexibleMonthFilter($query, string $column, array $tokens): void
    {
        $query->where(function ($inner) use ($column, $tokens) {
            foreach ($tokens as $token) {
                $inner->orWhereRaw('LOWER(TRIM(`'.$column.'`)) = ?', [strtolower($token)]);
            }
        });
    }

    private function monthTokens(Carbon $now): array
    {
        return array_values(array_unique([
            strtolower($now->format('F')),
            strtolower($now->format('M')),
            (string) $now->month,
            str_pad((string) $now->month, 2, '0', STR_PAD_LEFT),
        ]));
    }

    private function loadAcademicNameMaps(Connection $tenantDb): array
    {
        return [
            'grades' => Schema::connection('tenant')->hasTable('grades')
                ? $tenantDb->table('grades')->pluck('grade_name', 'id')
                : collect(),
            'classes' => Schema::connection('tenant')->hasTable('classes')
                ? $tenantDb->table('classes')->pluck('class_name', 'id')
                : collect(),
            'sections' => Schema::connection('tenant')->hasTable('sections')
                ? $tenantDb->table('sections')->pluck('section_name', 'id')
                : collect(),
        ];
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function resolveAcademicNames(?int $gradeId, ?int $classId, ?int $sectionId, array $maps): array
    {
        $gradeName = ($gradeId && $maps['grades']->has($gradeId))
            ? (string) $maps['grades']->get($gradeId)
            : ($gradeId ? 'Grade '.$gradeId : '-');
        $className = ($classId && $maps['classes']->has($classId))
            ? (string) $maps['classes']->get($classId)
            : ($classId ? 'Class '.$classId : '-');
        $sectionName = ($sectionId && $maps['sections']->has($sectionId))
            ? (string) $maps['sections']->get($sectionId)
            : ($sectionId ? 'Section '.$sectionId : '-');

        return [$gradeName, $className, $sectionName];
    }

    private function matchesAcademicFilters(?int $gradeId, ?int $classId, ?int $sectionId, array $filters): bool
    {
        if (! empty($filters['grade_id']) && (int) $filters['grade_id'] !== (int) $gradeId) {
            return false;
        }
        if (! empty($filters['class_id']) && (int) $filters['class_id'] !== (int) $classId) {
            return false;
        }
        if (! empty($filters['section_id']) && (int) $filters['section_id'] !== (int) $sectionId) {
            return false;
        }

        return true;
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

    private function registerStudentFeeStatus(
        int $studentId,
        string $studentName,
        int $feeId,
        string $feeTitle,
        ?int $gradeId,
        ?int $classId,
        ?int $sectionId,
        string $gradeName,
        string $className,
        string $sectionName,
        float $feeAmount,
        mixed $payment,
        array &$seenKeys,
        Collection &$unpaidList,
        int &$paidCount,
        int &$unpaidCount,
        float &$unpaidAmount,
        int &$expectedStudents,
    ): void {
        $key = $studentId.'-'.$feeId;
        if (isset($seenKeys[$key])) {
            return;
        }
        $seenKeys[$key] = true;

        $expectedStudents++;

        if ($this->isPaymentPaid($payment)) {
            $paidCount++;

            return;
        }

        $amount = ($payment && $payment->amount !== null)
            ? (float) $payment->amount
            : $feeAmount;

        $unpaidCount++;
        $unpaidAmount += $amount;
        $unpaidList->push([
            'id' => $key,
            'title' => $studentName,
            'subtitle' => $gradeName.' · '.$className.' · '.$sectionName,
            'grade_id' => $gradeId,
            'class_id' => $classId,
            'section_id' => $sectionId,
            'grade_name' => $gradeName,
            'class_name' => $className,
            'section_name' => $sectionName,
            'fee_title' => $feeTitle,
            'meta' => number_format($amount, 2),
            'status' => 'unpaid',
        ]);
    }

    private function appendDirectUnpaidPayments(
        Connection $tenantDb,
        Carbon $now,
        array $monthTokens,
        array $academicMaps,
        array $filters,
        bool $studentsHasDeletedAt,
        array &$seenKeys,
        Collection &$unpaidList,
        int &$paidCount,
        int &$unpaidCount,
        float &$unpaidAmount,
        int &$expectedStudents,
    ): void {
        $query = $tenantDb->table('payments')
            ->join('students', 'payments.student_id', '=', 'students.id')
            ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
            ->where(function ($inner) use ($now, $monthTokens) {
                $inner->where(function ($byDate) use ($now) {
                    $byDate->whereYear('payments.payment_date', $now->year)
                        ->whereMonth('payments.payment_date', $now->month);
                });

                foreach ($monthTokens as $token) {
                    $inner->orWhereRaw('LOWER(TRIM(payments.month)) = ?', [strtolower($token)]);
                }

                if (Schema::connection('tenant')->hasColumn('fees', 'month')) {
                    foreach ($monthTokens as $token) {
                        $inner->orWhereRaw('LOWER(TRIM(fees.month)) = ?', [strtolower($token)]);
                    }
                }
            })
            ->select(
                'payments.student_id',
                'payments.fee_id',
                'payments.section_id',
                'payments.grade_id',
                'payments.class_id',
                'payments.payment_status',
                'payments.amount',
                'students.name as student_name',
                'fees.title as fee_title',
                'fees.amount as fee_amount',
                'fees.grade_id as fee_grade_id',
                'fees.class_id as fee_class_id',
            )
            ->orderByDesc('payments.payment_date')
            ->orderByDesc('payments.id');

        if ($studentsHasDeletedAt) {
            $query->whereNull('students.deleted_at');
        }

        foreach ($query->get() as $row) {
            if ($this->isPaymentPaid($row)) {
                continue;
            }

            $feeId = (int) ($row->fee_id ?? 0);
            $studentId = (int) $row->student_id;
            if ($feeId <= 0 || $studentId <= 0) {
                continue;
            }

            $sectionName = (string) ($academicMaps['sections']->get($row->section_id) ?? ('Section '.$row->section_id));
            $feeTitle = (string) ($row->fee_title ?: 'Fee #'.$feeId);
            $feeAmount = (float) ($row->fee_amount ?? 0);
            $gradeId = (int) ($row->fee_grade_id ?? $row->grade_id ?? 0);
            $classId = (int) ($row->fee_class_id ?? $row->class_id ?? 0);
            [$gradeName, $className, $resolvedSectionName] = $this->resolveAcademicNames(
                $gradeId > 0 ? $gradeId : null,
                $classId > 0 ? $classId : null,
                (int) $row->section_id,
                $academicMaps,
            );

            if (! $this->matchesAcademicFilters(
                $gradeId > 0 ? $gradeId : null,
                $classId > 0 ? $classId : null,
                (int) $row->section_id,
                $filters,
            )) {
                continue;
            }

            $this->registerStudentFeeStatus(
                studentId: $studentId,
                studentName: (string) $row->student_name,
                feeId: $feeId,
                feeTitle: $feeTitle,
                gradeId: $gradeId > 0 ? $gradeId : null,
                classId: $classId > 0 ? $classId : null,
                sectionId: (int) $row->section_id,
                gradeName: $gradeName,
                className: $className,
                sectionName: $resolvedSectionName ?: $sectionName,
                feeAmount: $feeAmount,
                payment: $row,
                seenKeys: $seenKeys,
                unpaidList: $unpaidList,
                paidCount: $paidCount,
                unpaidCount: $unpaidCount,
                unpaidAmount: $unpaidAmount,
                expectedStudents: $expectedStudents,
            );
        }
    }

    private function emptyResult(string $monthLabel): array
    {
        return [
            'month' => $monthLabel,
            'items' => collect(),
            'expected_students' => 0,
            'paid_count' => 0,
            'unpaid_count' => 0,
            'unpaid_amount' => 0.0,
        ];
    }
}
