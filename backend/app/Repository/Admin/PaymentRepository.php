<?php

namespace App\Repository\Admin;

use App\Models\Grade;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Fee;
use App\Models\Payment;

class PaymentRepository implements PaymentRepositoryInterface
{
    public function showGroups()
    {
        // get all grades with sections
        $grades = Grade::with(['sections' => function ($query) {
            $query->with(['students' => function ($query) {
                $query->count();
            }]);
        }])->get();
        $teachers = Teacher::all();
        return view('dashboards.admin.Payment.show_groups', compact('grades', 'teachers'));
    }
    public function choosePaymentMonth($id)
    {
        $fees = Fee::where('section_id', $id)->get();
        $section_id = $id;
        return view('dashboards.admin.Payment.choose_payment_month', compact('fees', 'section_id'));
    }

    public function addEditPayment($section_id, $fee_id)
    {
        $fee = Fee::findOrFail($fee_id);
        $students = Student::with('payment')->where('section_id', $section_id)->get();
        return view('dashboards.admin.Payment.add_edit_payment', compact('students', 'fee'));
    }

    public function storeUpdatePayment($request)
    {

        // dd($request->all());
        try {

            foreach ($request->payments as $studentId => $payment) {

                $payment_status = $payment === 'true';
            
                Payment::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'month' => $request->month,
                    ],
                    [
                        'student_id'    => $studentId,
                        'grade_id'      => $request->grade_id,
                        'class_id'      => $request->class_id,
                        'section_id'    => $request->section_id,
                        'fee_id'        => $request->fee_id,
                        'amount'        => $request->payment_amount[$studentId] ?? $request->amount,
                        'notes'         => $request->payment_notes[$studentId] ?? '',
                        'month'         => $request->month,
                        'payment_date'  => $request->payment_dates[$studentId] ?? now()->format('Y-m-d'),
                        'payment_status'=> $payment_status,
                    ]
                );
            }
            

            return redirect()->back()->with('toast_success', 'Payment updated successfully');

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['toast_error' => $e->getMessage()]);
        }
    }


}
