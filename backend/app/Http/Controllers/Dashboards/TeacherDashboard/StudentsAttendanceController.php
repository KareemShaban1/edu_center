<?php

namespace App\Http\Controllers\Dashboards\TeacherDashboard;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Student;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StudentsAttendanceController extends Controller
{
    /// show teacher groups
    public function showGroups()
    {
        // get all grades with sections
        $grades = Grade::with(['sections' => function ($query) {

            $teacher_sections_ids = DB::table('teacher_section')
            ->where('teacher_id', auth()->user()->id)->pluck('section_id');

            // get sections with these ids with students
            $query->whereIn('id', $teacher_sections_ids)
            ->with(['students' => function ($query) {
                // get section students count
                $query->count();
            }]);

        }])->get();

        return view('dashboards.teacher.studentsAttendance.show_groups', compact('grades'));
    }



    public function showAttendance($id)
    {
        // get students of group with $id
        $students = Student::with('attendance')->where('section_id', $id)->get();

        return view('dashboards.teacher.studentsAttendance.attendance', compact('students'));
    }


    public function storeAttendance(Request $request)
    {

        try {
            $currentDate = date('Y-m-d');

            foreach ($request->attendances as $studentId => $attendances) {
                if ($attendances == 'presence') {
                    $attendanceStatus = true;
                } elseif ($attendances == 'absent') {
                    $attendanceStatus = false;
                }

                Attendance::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'attendance_date' => $currentDate
                    ],
                    [
                        'student_id' => $studentId,
                        'grade_id' => $request->grade_id,
                        'class_id' => $request->class_id,
                        'section_id' => $request->section_id,
                        'teacher_id' => Auth::user()->id,
                        'attendance_date' => $currentDate,
                        'attendance_status' => $attendanceStatus,
                        'notes'=>$request->notes
                    ]
                );
            }
            return redirect()->back();
        } catch (Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }








    public function attendanceSearchView()
    {
        $ids = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id');
        $students = Student::whereIn('section_id', $ids)->get();
        return view('dashboards.teacher.studentsAttendance.attendance_search', compact('students'));
    }




    public function attendanceSearch(Request $request)
    {
        $request->validate([
            'from' => 'required|date|date_format:Y-m-d',
            'to' => 'required|date|date_format:Y-m-d|after_or_equal:from'
        ], [
            'to.after_or_equal' => 'تاريخ النهاية لابد ان اكبر من تاريخ البداية او يساويه',
            'from.date_format' => 'صيغة التاريخ يجب ان تكون yyyy-mm-dd',
            'to.date_format' => 'صيغة التاريخ يجب ان تكون yyyy-mm-dd',
        ]);


        $ids = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id');
        $students = Student::whereIn('section_id', $ids)->get();

        if ($request->student_id == 0) {
            $Students = Attendance::whereBetween('attendance_date', [$request->from, $request->to])->get();
            return view('dashboards.teacher.studentsAttendance.attendance_report', compact('Students', 'students'));
        } else {
            $Students = Attendance::whereBetween('attendance_date', [$request->from, $request->to])
                ->where('student_id', $request->student_id)->get();
            return view('dashboards.teacher.studentsAttendance.attendance_search', compact('Students', 'students'));
        }
    }


}
