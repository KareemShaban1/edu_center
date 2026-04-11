<?php


namespace App\Repository\Admin;

use App\Models\ExamDegree;
use App\Models\Grade;
use App\Models\Section;
use App\Models\Student;

class ExamDegreeRepository implements ExamDegreeRepositoryInterface
{

    // show grades with their sections
    public function showGroups()
    {
        $grades = Grade::with(['sections' => function ($query) {
            $query->with(['students' => function ($query) {
                $query->count();
            }]);
        }])->get();
        return view('dashboards.admin.ExamDegree.show_groups', compact('grades'));
    }


    public function show($id)
    {
        $students = Student::with('exam')
            ->where('section_id', $id)->get();
        return view('dashboards.admin.ExamDegree.index', compact('students'));
    }


    public function choose_exam_day($id)
    {
        $exams = ExamDegree::where('section_id', $id)->get();
        return view('dashboards.admin.ExamDegree.choose_exam_day', compact('exams'));
    }



    // show exam degrees based on section and exam_date
    public function show_exam_degree($section_id, $exam_date)
    {
        $exams = ExamDegree::where('section_id', $section_id)->where('exam_date', $exam_date)->get();
        $students = Student::with('exam')->where('section_id', $section_id)->get();
        $section = Section::find($section_id);
        return view('dashboards.admin.ExamDegree.show_exam_degree', compact('exams', 'students', 'exam_date', 'section'));
    }




    public function storeUpdateExamDegree($request)
    {

        try {
            $student_id = $request->student_id;
            $grade_id = $request->grade_id;
            $class_id = $request->class_id;
            $section_id = $request->section_id;
            $exam_date = $request->exam_date;
            $degree = $request->degree;
            $notes = $request->notes;
            $final_degree = $request->final_degree;

            for ($i = 0; $i < count($degree); $i++) {
                // Skip if degree is null or empty string
                if (is_null($degree[$i]) || $degree[$i] === '') {
                    continue;
                }

                ExamDegree::updateOrCreate(
                    [
                        'student_id' => $student_id[$i],
                        'exam_date' => $exam_date[$i]
                    ],
                    [
                        'grade_id' => $grade_id[$i],
                        'class_id' => $class_id[$i],
                        'section_id' => $section_id[$i],
                        'student_id' => $student_id[$i],
                        'exam_date' => $exam_date[$i],
                        'degree' => $degree[$i],
                        'final_degree' => $final_degree,
                        'notes' => $notes[$i] ?? null
                    ]
                );
            }
            return redirect()->back()
                ->with('toast_success', 'تم حفظ درجات الامتحان بنجاح');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('toast_error', 'فشل في حفظ درجات الامتحان')
                ->withErrors(['error' => $e->getMessage()]);
        }
    }


    public function sendNotifications($studentId)
    {

        // $student = Student::find($studentId);
        // $parent = $student->parents;
        // $studentAttendance = $student->attendance()
        //     ->where('attendance_date', date('Y-m-d'))
        //     ->first();

        // $student->notify(new StudentAttendanceNotification($studentAttendance->attendance_status));
        // $parent->notify(new ParentAttendanceNotification($student->name, $studentAttendance->attendance_status));

        // return  redirect()->back()->with('toast_success', 'notification send successfully');
    }

    public function sendWhatsappMessage($studentId)
    {
        $student = Student::with('parents')->find($studentId);
        $message = request()->get('message');


        if (!$student || !$student->parents || !$student->parents->father_phone) {
            return redirect()->back()->with('error', 'رقم ولي الأمر غير متوفر.');
        }

        $cleanPhone = '20' . ltrim(preg_replace('/[^0-9]/', '', $student->parents->father_phone), '0');
        $encodedMessage = urlencode($message);
        $whatsappUrl = "https://wa.me/{$cleanPhone}?text={$encodedMessage}";

        return $whatsappUrl;
    }
}
