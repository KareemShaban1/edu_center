<?php


namespace App\Repository\Admin;


use App\Models\QuizDegree;
use App\Models\Grade;
use App\Models\Section;
use App\Models\Student;

class QuizDegreeRepository implements QuizDegreeRepositoryInterface
{

    public function showGroups()
    {

        $grades = Grade::with(['sections' => function ($query) {
            $query->with(['students' => function ($query) {
                $query->count();
            }]);
        }])->get();

        return view('dashboards.admin.QuizDegree.show_groups', compact('grades'));
    }


    public function show($id)
    {
        $students = Student::with('quiz')->where('section_id', $id)->get();

        return view('dashboards.admin.QuizDegree.index', compact('students'));
    }

    public function choose_quiz_day($id)
    {
        $quizes = QuizDegree::where('section_id', $id)->get();

        return view('dashboards.admin.QuizDegree.choose_quiz_day', compact('quizes'));
    }

    public function show_quiz_degree($section_id, $date)
    {
        $quizes = QuizDegree::where('section_id', $section_id)
        ->where('quiz_date', $date)->get();
        $students = Student::with('quiz')
        ->where('section_id', $section_id)->get();
        $quiz_date = $date;
        $section = Section::find($section_id);

        return view('dashboards.admin.QuizDegree.show_quiz_degree', compact('quizes', 'students', 'quiz_date', 'section'));
    }

    public function store_update_quiz_degree($request)
    {
        try {
            $student_id = $request->student_id;
            $grade_id = $request->grade_id;
            $class_id = $request->class_id;
            $section_id = $request->section_id;
            $quiz_date = $request->quiz_date;
            $degree = $request->degree;
            $notes = $request->notes;
            $final_degree = $request->final_degree;

            for ($i = 0; $i < count($student_id); $i++) {
                // Skip if degree is null or empty string
                if (is_null($degree[$i]) || $degree[$i] === '') {
                    continue;
                }

                QuizDegree::updateOrCreate(
                    [
                        'student_id' => $student_id[$i],
                        'quiz_date' => $quiz_date[$i]
                    ],
                    [
                        'grade_id' => $grade_id[$i],
                        'class_id' => $class_id[$i],
                        'section_id' => $section_id[$i],
                        'student_id' => $student_id[$i],
                        'quiz_date' => $quiz_date[$i],
                        'degree' => $degree[$i],
                        'final_degree' => $final_degree,
                        'notes' => $notes[$i]
                    ]
                );
            }


            return redirect()->back()->with('toast_success', 'Quiz degrees updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }



    public function edit($id) {

    }



    public function store($request)
    {

        try {

            $student_id = $request->student_id;
            $grade_id = $request->grade_id;
            $classroom_id = $request->classroom_id;
            $section_id = $request->section_id;
            $quiz_date = $request->quiz_date;
            $degree = $request->degree;
            $final_degree = $request->final_degree;
            $notes = $request->notes;
            for ($i = 0; $i < count($student_id); $i++) {

                // Skip if degree is null or empty string
                if (is_null($degree[$i]) || $degree[$i] === '') {
                    continue;
                }

                QuizDegree::updateOrCreate(
                    [
                        'student_id' => $student_id[$i],
                        'quiz_date' => $quiz_date[$i]
                    ],
                    [
                        'grade_id' => $grade_id[$i],
                        'classroom_id' => $classroom_id[$i],
                        'section_id' => $section_id[$i],
                        'student_id' => $student_id[$i],
                        'quiz_date' => $quiz_date[$i],
                        'degree' => $degree[$i],
                        'final_degree' => $final_degree[$i],
                        'notes' => $notes[$i]
                    ]
                );
            }


            return redirect()->back();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
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

    public function update($request)
    {
    }

    public function destroy($request)
    {
    }
}
