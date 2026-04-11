<?php

namespace App\Http\Controllers\Dashboards\TeacherDashboard;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ExamDegree;
use App\Models\ExamDegreeDegree;
use App\Models\Payment;
use App\Models\Quiz;
use App\Models\QuizDegree;
use App\Models\Section;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TeacherDashboardController extends Controller
{
    // teacher dashboard
    public function index()
    {

        $sections_ids = Teacher::findOrFail(Auth::user('teacher')->id)
        ->sections()->pluck('section_id');
        $data['count_sections']= $sections_ids->count();
        $data['count_students']= Student::whereIn('section_id', $sections_ids)->count();

        return view('dashboards.teacher.dashboard', $data);
    }

    // get all sections related to teacher
    public function TeacherGroups()
    {
        $teacher_sections_ids = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id');
        $sections = Section::whereIn('id', $teacher_sections_ids)->get();
        return view('dashboards.teacher.teacherGroups.show', compact('sections'));
    }

    public function attendanceReport()
    {
        $ids = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id')->toArray();
        $students = Student::whereIn('section_id', $ids)->get();
        $studentsIds = $students->pluck('id')->toArray();
        $attendances = Attendance::whereIn('student_id', $studentsIds)->get();
        
        return view(
            'dashboards.teacher.studentsReports.attendance_report',
            compact('attendances')
        );
    }

    public function examReport()
    {
        $ids = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id')->toArray();
        $students = Student::whereIn('section_id', $ids)->get();
        $studentsIds = $students->pluck('id')->toArray();

        $exams = ExamDegree::whereIn('student_id', $studentsIds)->get();
        // $attendances = Attendance::whereIn('student_id', $studentsIds)->get();
        return view(
            'dashboards.teacher.studentsReports.exam_report',
            compact('exams')
        );

    }
    

    public function quizReport()
    {
        $ids = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id')->toArray();
        $students = Student::whereIn('section_id', $ids)->get();
        $studentsIds = $students->pluck('id')->toArray();
        $quizzes = QuizDegree::whereIn('student_id', $studentsIds)->get();

        return view(
            'dashboards.teacher.studentsReports.quiz_report',
            compact('quizzes')
        );
    }

    public function paymentReport()
    {
        $ids = DB::table('teacher_section')->where('teacher_id', auth()->user()->id)->pluck('section_id')->toArray();
        $students = Student::whereIn('section_id', $ids)->get();
        $studentsIds = $students->pluck('id')->toArray();
        $payments = Payment::whereIn('student_id', $studentsIds)->get();

        return view(
            'dashboards.teacher.studentsReports.payment_report',
            compact('payments')
        );
    }


}
