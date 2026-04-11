<?php

namespace App\Http\Controllers\Dashboards\StudentDashboard;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Quiz;
use App\Models\ExamDegree;
use App\Models\ExamDegreeDegree;
use App\Models\Library;
use App\Models\Meeting;
use App\Models\Payment;
use App\Models\QuizDegree;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentDashboardController extends Controller
{
    //

    public function studentAttendance(Request $request, $student_id)
    {
        if ($request->ajax()) {
            $query = Attendance::where('student_id', $student_id)
                ->with(['student', 'grade', 'class', 'section']);
    
            // ✅ Filter by start_date
            if ($request->filled('start_date')) {
                $query->whereDate('attendance_date', '>=', $request->start_date);
            }
    
            // ✅ Filter by end_date
            if ($request->filled('end_date')) {
                $query->whereDate('attendance_date', '<=', $request->end_date);
            }
    
            // ✅ Filter by month_year
            if ($request->filled('month_year')) {
                [$year, $month] = explode('-', $request->month_year);
                $query->whereYear('attendance_date', $year)
                      ->whereMonth('attendance_date', $month);
            }
    
            $attendences = $query->latest()->get();
    
            $data = $attendences->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'student_name' => optional($attendance->student)->name,
                    'grade' => optional($attendance->grade)->grade_name,
                    'class' => optional($attendance->class)->class_name,
                    'section' => optional($attendance->section)->section_name,
                    'attendance_date' => $attendance->attendance_date,
                    'attendance_status' => $attendance->attendance_status,
                    'notes' => $attendance->notes,
                    'created_at' => $attendance->created_at->format('Y-m-d'),
                ];
            });
    
            return response()->json(['data' => $data]);
        }
    
        return view('dashboards.student.attendance.student_attendance', compact('student_id'));
    }

    public function dashboardPage()
    {
        $student = Auth::user('student');

        $totalAttendance = $student->attendance()->count();
        $presentCount = $student->attendance()->where('attendance_status', 1)->count();
        $absentCount = $student->attendance()->where('attendance_status', 0)->count();
        $attendanceRate = $totalAttendance > 0 ? ($presentCount / $totalAttendance) * 100 : 0;

        $exams = $student->exam()->orderBy('exam_date', 'desc')->take(5)->get();
        $examCount = $student->exam()->count();

        $examTotal = $student->exam()->sum('degree');
        $examFinalTotal = $student->exam()->sum('final_degree');
        $examPercentage = $examFinalTotal > 0 ? ($examTotal / $examFinalTotal) * 100 : 0;
        $examAverage = $examCount > 0 ? $examTotal / $examCount : 0;

        $latestExam = $student->exam()->orderBy('exam_date', 'desc')->first();
        $latestExamRatio = $latestExam ? $latestExam->degree . '/' . $latestExam->final_degree : 'لا يوجد';

        $quizzes = $student->quiz()->orderBy('quiz_date', 'desc')->take(5)->get();
        $quizCount = $student->quiz()->count();

        $quizTotal = $student->quiz()->sum('degree');
        $quizFinalTotal = $student->quiz()->sum('final_degree');
        $quizPercentage = $quizFinalTotal > 0 ? ($quizTotal / $quizFinalTotal) * 100 : 0;
        $quizAverage = $quizCount > 0 ? $quizTotal / $quizCount : 0;

        $latestQuiz = $student->quiz()->orderBy('quiz_date', 'desc')->first();
        $latestQuizRatio = $latestQuiz ? $latestQuiz->degree . '/' . $latestQuiz->final_degree : 'لا يوجد';

        $examTrend = $student->exam()->orderBy('exam_date', 'desc')->take(5)->pluck('degree')->toArray();

        $quizTrend = $student->quiz()->orderBy('quiz_date', 'desc')->take(5)->pluck('degree')->toArray();

        $overallPercentage = $examPercentage > 0 || $quizPercentage > 0 ?
            round(($examPercentage + $quizPercentage) / (($examPercentage > 0 ? 1 : 0) + ($quizPercentage > 0 ? 1 : 0)), 1) : 0;

        $data = [
            'student' => $student,
            'attendance' => [
                'total' => $totalAttendance,
                'present' => $presentCount,
                'absent' => $absentCount,
                'rate' => round($attendanceRate, 2)
            ],
            'exams' => [
                'recent' => $exams,
                'average' => round($examAverage, 2),
                'count' => $examCount,
                'trend' => $examTrend,
                'percentage' => round($examPercentage, 2),
                'latest_ratio' => $latestExamRatio,
                'total_score' => $examTotal,
                'total_possible' => $examFinalTotal
            ],
            'quizzes' => [
                'recent' => $quizzes,
                'average' => round($quizAverage, 2),
                'count' => $quizCount,
                'trend' => $quizTrend,
                'percentage' => round($quizPercentage, 2),
                'latest_ratio' => $latestQuizRatio,
                'total_score' => $quizTotal,
                'total_possible' => $quizFinalTotal
            ],
            'overall_percentage' => $overallPercentage
        ];

        return view('dashboards.student.dashboard', compact('data'));
    }

    public function studentPayment(Request $request, $student_id)
    {
        if ($request->ajax()) {
            $query = Payment::where('student_id', $student_id)
                ->with(['student', 'grade', 'class', 'section']);
    
            // ✅ Filter by start_date
            if ($request->filled('start_date')) {
                $query->whereDate('payment_date', '>=', $request->start_date);
            }
    
            // ✅ Filter by end_date
            if ($request->filled('end_date')) {
                $query->whereDate('payment_date', '<=', $request->end_date);
            }
    
            // ✅ Filter by month_year
            if ($request->filled('month_year')) {
                [$year, $month] = explode('-', $request->month_year);
                $query->whereYear('payment_date', $year)
                      ->whereMonth('payment_date', $month);
            }
    
            $payments = $query->latest()->get();
    
            $data = $payments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'student_name' => optional($payment->student)->name,
                    'grade' => optional($payment->grade)->grade_name,
                    'class' => optional($payment->class)->class_name,
                    'section' => optional($payment->section)->section_name,
                    'month' => $payment->month,
                    'payment_date' => $payment->payment_date,
                    'payment_status' => $payment->payment_status,
                    'notes' => $payment->notes,
                    'created_at' => $payment->created_at->format('Y-m-d'),
                ];
            });
    
            return response()->json(['data' => $data]);
        }
    
        return view('dashboards.student.payment.student_payment', compact('student_id'));
    }
    

    public function studentQuiz(Request $request, $student_id)
    {
        $query = QuizDegree::where('student_id', $student_id);
    
        if ($request->ajax()) {
            if ($request->start_date && $request->end_date) {
                $query->whereBetween('quiz_date', [$request->start_date, $request->end_date]);
            }
    
            if ($request->month_year) {
                $query->whereYear('quiz_date', substr($request->month_year, 0, 4))
                      ->whereMonth('quiz_date', substr($request->month_year, 5, 2));
            }
    
            $quizes = $query->get();
    
            return response()->json([
                'html' => view('dashboards.student.quiz.partials.quiz_cards', compact('quizes'))->render()
            ]);
        }
    
        $quizes = $query->get();
        return view('dashboards.student.quiz.student_quiz', compact('quizes', 'student_id'));
    }

    public function studentExam(Request $request, $student_id)
    {
        $query = ExamDegree::where('student_id', $student_id);
    
        if ($request->ajax()) {
            if ($request->start_date && $request->end_date) {
                $query->whereBetween('exam_date', [$request->start_date, $request->end_date]);
            }
    
            if ($request->month_year) {
                $query->whereYear('exam_date', substr($request->month_year, 0, 4))
                      ->whereMonth('exam_date', substr($request->month_year, 5, 2));
            }
    
            $exams = $query->get();
    
            return response()->json([
                'html' => view('dashboards.student.exam.partials.exam_cards', compact('exams'))->render()
            ]);
        }
    
        $exams = $query->get();
        return view('dashboards.student.exam.student_exam', compact('exams', 'student_id'));
    }
    


    public function download($filename)
    {
        return response()->download(public_path('storage/attachments/library/' . $filename));
    }


    public function studentMeetings($student_id)
    {
        if ($this->checkStudentSection($student_id)) {
            return redirect()->back();
        }
        $student = Student::findOrFail($student_id);
        $meetings = Meeting::where('section_id', $student->section_id)->get();

        return view('dashboards.student.meetings.student_meetings', compact('meetings'));
    }


    public function studentAnnouncements($student_id)
    {
        if ($this->checkStudentSection($student_id)) {
            return redirect()->back();
        }
        $announcements = Announcement::where('section_id', $student_id)->get();
        return view('dashboards.student.announcements.student_announcements', compact('announcements', 'student_id'));
    }

    public function filterAnnouncements(Request $request, $student_id)
{
    $query = Announcement::where('section_id', $student_id);

    if ($request->filled('start_date')) {
        $query->whereDate('created_at', '>=', $request->start_date);
    }
    if ($request->filled('end_date')) {
        $query->whereDate('created_at', '<=', $request->end_date);
    }
    if ($request->filled('month_year')) {
        [$year, $month] = explode('-', $request->month_year);
        $query->whereYear('created_at', $year)
              ->whereMonth('created_at', $month);
    }

    $announcements = $query->latest()->get();

    $html = view('dashboards.student.announcements.partials.announcement_cards', compact('announcements'))->render();

    return response()->json(['html' => $html]);
}


    public function checkStudentSection($student_id)
    {
        $student = auth()->user();
        if ($student->section_id != $student_id) {
            return true;
        }
        return false;
    }
}
