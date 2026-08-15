<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class PaymentService
{
    /**
     * @return array{date: string, fees: Collection, selected_fee_id: ?int, rows: Collection}
     */
    public function getSectionDate(int $sectionId, string $date, ?int $requestedFeeId): array
    {
        $tenantDb = DB::connection('center');

        $feesHasFeeType = Schema::connection('center')->hasColumn('fees', 'fee_type');
        $feesHasLegacyType = Schema::connection('center')->hasColumn('fees', 'Fee_type');
        $feeTypeSelect = $feesHasFeeType
            ? 'fee_type as type'
            : ($feesHasLegacyType ? 'Fee_type as type' : DB::raw("'monthly' as type"));

        $mapFees = static fn ($rows) => collect($rows)->map(static fn ($fee) => [
            'id' => (int) $fee->id,
            'title' => $fee->title,
            'amount' => (float) $fee->amount,
            'month' => $fee->month,
            'year' => $fee->year,
            'type' => $fee->type,
        ])->values();

        $feeSelect = ['id', 'title', 'amount', 'month', 'year', $feeTypeSelect];
        $fees = $mapFees(
            $tenantDb->table('fees')
                ->where('section_id', $sectionId)
                ->select($feeSelect)
                ->get()
        );

        $selectedFee = $requestedFeeId
            ? $fees->first(static fn ($fee) => (int) $fee['id'] === $requestedFeeId)
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
            ->when($defaultFeeId, fn ($query) => $query->where('fee_id', $defaultFeeId))
            ->when(! $defaultFeeId, fn ($query) => $query->whereDate('payment_date', $date))
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->get(['id', 'student_id', 'payment_date', 'fee_id', 'payment_status', 'month', 'amount', 'notes'])
            ->unique('student_id')
            ->keyBy('student_id');

        $rows = $students->map(function ($student) use ($paymentsByStudent, $defaultFeeId, $defaultMonth, $defaultAmount, $date) {
            $payment = $paymentsByStudent->get($student->id);

            return [
                'id' => $payment?->id ? (int) $payment->id : null,
                'student_id' => (int) $student->id,
                'student_name' => $student->name,
                'payment_date' => $payment?->payment_date ? Carbon::parse($payment->payment_date)->toDateString() : $date,
                'fee_id' => $payment?->fee_id ? (int) $payment->fee_id : $defaultFeeId,
                'payment_status' => isset($payment->payment_status) ? ((int) $payment->payment_status === 1 ? 'paid' : 'unpaid') : 'unpaid',
                'month' => $payment?->month ?? $defaultMonth,
                'amount' => isset($payment->amount) ? (float) $payment->amount : $defaultAmount,
                'notes' => $payment?->notes ?? '',
            ];
        })->values();

        return [
            'date' => $date,
            'fees' => $fees,
            'selected_fee_id' => $defaultFeeId,
            'rows' => $rows,
        ];
    }

    /**
     * @return array{days: Collection}
     */
    public function getSectionHistory(int $sectionId, ?int $feeId = null): array
    {
        $days = DB::connection('center')->table('payments')
            ->where('section_id', $sectionId)
            ->when($feeId, static fn ($query) => $query->where('fee_id', $feeId))
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
            ->map(static fn ($row) => [
                'date' => $row->date,
                'paid' => (int) $row->paid,
                'unpaid' => (int) $row->unpaid,
                'total_amount' => (float) $row->total_amount,
                'total' => (int) $row->total,
            ])
            ->values();

        return ['days' => $days];
    }

    /**
     * @param  array{rows: list<array{id?: ?int, student_id: int, payment_date?: ?string, fee_id: int, payment_status: string, month: string, amount?: ?float, notes?: ?string}>}  $payload
     */
    public function saveSectionDate(int $sectionId, string $date, array $payload): void
    {
        $tenantDb = DB::connection('center');
        $students = $tenantDb->table('students')
            ->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())
            ->get(['id', 'grade_id', 'class_id', 'section_id'])
            ->keyBy('id');

        DB::connection('center')->transaction(function () use ($tenantDb, $payload, $sectionId, $date, $students): void {
            foreach ($payload['rows'] as $row) {
                $student = $students->get($row['student_id']);
                if (! $student || (int) $student->section_id !== $sectionId) {
                    continue;
                }

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
        });
    }
}
