<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Section;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function sectionFees(Request $request, $id)
    {
        $from = $request->input('from');
        $to = $request->input('to');
    
        // Default to current range: today → end of month
        if (!$from || !$to) {
            $from = Carbon::now()->toDateString();
            $to = Carbon::now()->endOfMonth()->toDateString();
        }
    
        $section = Section::with(['students', 'students.gender', 'students.grade', 'students.class', 'students.section'])->withCount('students')->findOrFail($id);
    
        $payments = Payment::where('section_id', $id)
            ->where('payment_status', 1)
            ->whereBetween('payment_date', [$from, $to])
            ->with(['student.gender', 'student.grade', 'student.class', 'student.section'])
            ->get();
    
        if ($request->ajax()) {
            $response = [
                'students_count' => $section->students_count,
                'paid_students' => $payments->count(),
                'unpaid_students' => $section->students_count - $payments->count(),
                'amount' => $payments->sum('amount'),
            ];
    
            if ($payments->isNotEmpty()) {
                $response['students'] = $payments->map(function ($payment, $index) {
                    $student = $payment->student;
                    return [
                        'index' => $index + 1,
                        'name' => $student->name ?? '-',
                        'email' => $student->email ?? '-',
                        'gender' => $student->gender ?? '-',
                        'grade' => $student->grade->grade_name ?? '-',
                        'class' => $student->class->class_name ?? '-',
                        'section' => $student->section->section_name ?? '-',
                        'payment_date' => $payment->payment_date,
                        'payment_status' => $payment->payment_status
                    ];
                });
            } else {
                $response['students'] = $section->students->map(function ($student, $index) {
                    return [
                        'index' => $index + 1,
                        'name' => $student->name ?? '-',
                        'email' => $student->email ?? '-',
                        'gender' => $student->gender ?? '-',
                        'grade' => $student->grade->grade_name ?? '-',
                        'class' => $student->class->class_name ?? '-',
                        'section' => $student->section->section_name ?? '-',
                        'payment_date' => '',
                        'payment_status' => '',
                    ];
                });
            }
    
            return response()->json($response);
        }
    
        return view('dashboards.admin.reports.sectionFees', [
            'section' => $section,
            'payments' => $payments,
            'from' => $from,
            'to' => $to,
        ]);
    }
    
    
    
}
