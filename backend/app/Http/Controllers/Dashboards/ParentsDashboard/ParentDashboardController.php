<?php

namespace App\Http\Controllers\Dashboards\ParentsDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Attendance;
use App\Models\Quiz;
use App\Models\ExamDegree;
use App\Models\ExamDegreeDegree;
use App\Models\Parents;
use App\Models\Payment;
use App\Models\QuizDegree;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ParentDashboardController extends Controller
{
    public function index()
    {
        $students = Student::where('parent_id', auth()->user('parent')->id)->get();
        return view('dashboards.parents.student.index', compact('students'));
    }

    public function dashboardPage(Request $request)
    {
        $sons = Student::with(['grade', 'class', 'attendance', 'exam', 'quiz'])
            ->where('parent_id', Auth::user()->id)
            ->get();
        $data = [];

        $selectedStudentId = $request->query('student_id', $sons->first()->id ?? null);
        $selectedStudent = $sons->where('id', $selectedStudentId)->first();

        if ($selectedStudent) {
            $totalAttendance = $selectedStudent->attendance()->count();
            $presentCount = $selectedStudent->attendance()->where('attendance_status', 1)->count();
            $absentCount = $selectedStudent->attendance()->where('attendance_status', 0)->count();
            $attendanceRate = $totalAttendance > 0 ? ($presentCount / $totalAttendance) * 100 : 0;

            $exams = $selectedStudent->exam()->orderBy('exam_date', 'desc')->take(5)->get();
            $examCount = $selectedStudent->exam()->count();

            $examTotal = $selectedStudent->exam()->sum('degree');
            $examFinalTotal = $selectedStudent->exam()->sum('final_degree');
            $examPercentage = $examFinalTotal > 0 ? ($examTotal / $examFinalTotal) * 100 : 0;
            $examAverage = $examCount > 0 ? $examTotal / $examCount : 0;

            $latestExam = $selectedStudent->exam()->orderBy('exam_date', 'desc')->first();
            $latestExamRatio = $latestExam ? $latestExam->degree . '/' . $latestExam->final_degree : 'لا يوجد';

            $quizzes = $selectedStudent->quiz()->orderBy('quiz_date', 'desc')->take(5)->get();
            $quizCount = $selectedStudent->quiz()->count();

            $quizTotal = $selectedStudent->quiz()->sum('degree');
            $quizFinalTotal = $selectedStudent->quiz()->sum('final_degree');
            $quizPercentage = $quizFinalTotal > 0 ? ($quizTotal / $quizFinalTotal) * 100 : 0;
            $quizAverage = $quizCount > 0 ? $quizTotal / $quizCount : 0;
            $latestQuiz = $selectedStudent->quiz()->orderBy('quiz_date', 'desc')->first();
            $latestQuizRatio = $latestQuiz ? $latestQuiz->degree . '/' . $latestQuiz->final_degree : 'لا يوجد';
            $latestQuiz = $selectedStudent->quiz()->orderBy('quiz_date', 'desc')->first();
            $latestQuizRatio = $latestQuiz ? $latestQuiz->degree . '/' . $latestQuiz->final_degree : 'لا يوجد';

            $overallPercentage = $examPercentage > 0 || $quizPercentage > 0 ?
                round(($examPercentage + $quizPercentage) / (($examPercentage > 0 ? 1 : 0) + ($quizPercentage > 0 ? 1 : 0)), 1) : 0;

            $data = [
                'student' => $selectedStudent,
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
                    'percentage' => round($examPercentage, 2),
                    'latest_ratio' => $latestExamRatio,
                    'total_score' => $examTotal,
                    'total_possible' => $examFinalTotal
                ],
                'quizzes' => [
                    'recent' => $quizzes,
                    'average' => round($quizAverage, 2),
                    'count' => $quizCount,
                    'percentage' => round($quizPercentage, 2),
                    'latest_ratio' => $latestQuizRatio,
                    'total_score' => $quizTotal,
                    'total_possible' => $quizFinalTotal
                ],
                'overall_percentage' => $overallPercentage
            ];
        }

        return view('dashboards.parents.dashboard', compact('data', 'sons'));
    }

    // get son / student attendance
    public function studentAttendance($student_id)
    {
        $attendances = Attendance::where('student_id', $student_id)->get();
        $student = Student::where('id', $student_id)->first();
        return view(
            'dashboards.parents.attendance.index',
            compact('attendances', 'student')
        );
    }

    // get son / student payment
    public function studentPayment($student_id)
    {
        $payments = Payment::where('student_id', $student_id)->get();
        return view('dashboards.parents.payment.student_payment', compact('payments'));
    }

    // get son / student quiz
    public function studentQuiz($student_id)
    {
        $quizzes = QuizDegree::where('student_id', $student_id)->get();
        $student = Student::where('id', $student_id)->first();
        return view('dashboards.parents.quiz.student_quiz', compact('quizzes', 'student'));
    }

    // get son / student exam
    public function studentExam($id)
    {
        $exams = ExamDegree::where('student_id', $id)->get();
        $student = Student::where('id', $id)->first();
        return view('dashboards.parents.exam.student_exam', compact('exams', 'student'));
    }





    /**
     * Display attendance report for all parent's children with filtering options
     *
     * @return \Illuminate\View\View
     */
    public function sonsAttendance()
    {
        // Get the authenticated parent
        $parent = Auth::guard('parent')->user();

        // Get all students belonging to the parent with necessary relationships
        $students = Student::where('parent_id', $parent->id)
            ->with(['grade', 'class'])
            ->orderBy('name')
            ->get();

        if ($students->isEmpty()) {
            return view('dashboards.parents.attendance.attendance_report', [
                'attendances' => collect([])->paginate(15),
                'students' => $students,
                'summary' => [
                    'total' => 0,
                    'present' => 0,
                    'absent' => 0,
                    'present_percentage' => 0
                ],
                'filters' => []
            ]);
        }

        // Start building the attendance query
        $query = Attendance::query()
            ->whereIn('student_id', $students->pluck('id'))
            ->with([
                'student:id,name,email',
                'grade:id,grade_name',
                'class:id,class_name',
                'section:id,section_name'
            ]);

        // Apply filters if provided
        $filters = request()->only(['student_id', 'start_date', 'end_date']);

        if (!empty($filters['student_id'])) {
            $query->where('student_id', $filters['student_id']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('attendance_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('attendance_date', '<=', $filters['end_date']);
        } else {
            // Default to today if no end date is provided
            $query->whereDate('attendance_date', '<=', now()->format('Y-m-d'));
        }

        // Get paginated results
        $attendances = $query->latest('attendance_date')
            ->paginate(15)
            ->appends($filters);

        // Get counts for summary
        $presentCount = (clone $query)->where('attendance_status', 1)->count();
        $absentCount = (clone $query)->where('attendance_status', 0)->count();
        $total = $presentCount + $absentCount;

        // Add summary statistics
        $summary = [
            'total' => $total,
            'present' => $presentCount,
            'absent' => $absentCount,
            'present_percentage' => $total > 0 ? round(($presentCount / $total) * 100, 2) : 0
        ];

        return view('dashboards.parents.attendance.attendance_report', [
            'attendances' => $attendances,
            'students' => $students,
            'summary' => $summary,
            'filters' => $filters
        ]);
    }

    // get parent all sons / students exams
    public function sonsExam(Request $request)
    {
        $students = Student::where('parent_id', Auth::id())->get();
        $studentsIds = $students->pluck('id')->toArray();
    
        $query = ExamDegree::with(['students', 'grade', 'class', 'section'])
            ->whereIn('student_id', $studentsIds);
    
        // ✅ Apply filters
        if ($request->ajax()) {
            if ($request->filled('start_date')) {
                $query->whereDate('exam_date', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->whereDate('exam_date', '<=', $request->end_date);
            }
            if ($request->filled('month_year')) {
                [$year, $month] = explode('-', $request->month_year);
                $query->whereYear('exam_date', $year)->whereMonth('exam_date', $month);
            }
            if ($request->filled('student_id')) {
                $query->where('student_id', $request->student_id);
            }
    
            $exams = $query->orderByDesc('exam_date')->get();
    
            return response()->json(['exams' => $exams]);
        }
    
        $exams = $query->orderByDesc('exam_date')->get();
        return view('dashboards.parents.exam.exam_report', compact('students', 'exams'));
    }
    



    // get parent all sons / students quizzes
    public function sonsQuiz(Request $request)
    {
        $students = Student::where('parent_id', Auth::id())->get();
        $studentsIds = $students->pluck('id')->toArray();
    
        $query = QuizDegree::with(['students', 'grade', 'class', 'section'])
            ->whereIn('student_id', $studentsIds);
    
        // ✅ Apply filters
        if ($request->ajax()) {
            if ($request->filled('start_date')) {
                $query->whereDate('quiz_date', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->whereDate('quiz_date', '<=', $request->end_date);
            }
            if ($request->filled('month_year')) {
                [$year, $month] = explode('-', $request->month_year);
                $query->whereYear('quiz_date', $year)->whereMonth('quiz_date', $month);
            }
            if ($request->filled('student_id')) {
                $query->where('student_id', $request->student_id);
            }
    
            $quizzes = $query->orderByDesc('quiz_date')->get();
    
            return response()->json(['quizzes' => $quizzes]);
        }
    
        $quizzes = $query->orderByDesc('quiz_date')->get();
        return view('dashboards.parents.quiz.quiz_report', compact('students', 'quizzes'));
    }

    public function sonsPayment(Request $request)
    {

        $students = Student::where('parent_id', Auth::id())->get();
        $studentsIds = $students->pluck('id')->toArray();
    
        $query = Payment::with(['student', 'grade', 'class', 'section'])
            ->whereIn('student_id', $studentsIds);
    
        // ✅ Apply filters
        if ($request->ajax()) {
            if ($request->filled('start_date')) {
                $query->whereDate('payment_date', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->whereDate('payment_date', '<=', $request->end_date);
            }
            if ($request->filled('month_year')) {
                [$year, $month] = explode('-', $request->month_year);
                $query->whereYear('payment_date', $year)->whereMonth('payment_date', $month);
            }
            if ($request->filled('student_id')) {
                $query->where('student_id', $request->student_id);
            }
    
            $payments = $query->orderByDesc('payment_date')->get();
    
            return response()->json(['payments' => $payments]);
        }
    
        $payments = $query->orderByDesc('payment_date')->get();
        return view('dashboards.parents.payment.payment_report', compact('students', 'payments'));

    }





    public function attendances()
    {
        $students = Student::where('parent_id', auth()->user('parent')->id)->get();
        return view('dashboards.parents.attendance.searchAttendance', compact('students'));
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

        $students = Student::where('parent_id', auth()->user('parent')->id)->get();

        if ($request->student_id == 0) {
            $studentsAttendance = Attendance::whereBetween('attendance_date', [$request->from, $request->to])->get();
            return view('dashboards.parents.attendance.searchAttendance', compact('studentsAttendance', 'students'));
        } else {
            $studentsAttendance = Attendance::whereBetween('attendance_date', [$request->from, $request->to])
                ->where('student_id', $request->student_id)->get();
            return view('dashboards.parents.attendance.searchAttendance', compact('studentsAttendance', 'students'));
        }
    }



    public function profile()
    {
        $parent = Parents::findOrFail(auth()->user()->id);
        return view('dashboards.parents.profile', compact('parent'));
    }


    public function updateProfile(UpdateProfileRequest $request, $id)
    {
        $data = $request->validated();
        $parent = Parents::findOrFail($id);

        if (!empty($data['password'])) {
            $parent->father_name = ['en' => $data['Name_en'], 'ar' => $data['Name_ar']];
            $parent->password = Hash::make($data['password']);
            $parent->save();
        } else {
            $parent->father_name = ['en' => $data['Name_en'], 'ar' => $data['Name_ar']];
            $parent->save();
        }
        return redirect()->back()->with('toast_success', 'Profile updated successfully');
    }
}
