<?php

namespace App\Repository\Admin;

use App\Models\Grade;
use App\Models\Student;
use App\Models\Attendance;
use App\Events\AttendanceUpdated;
use App\Events\StudentStatusChanged;
use App\Models\Section;
use App\Notifications\ParentAttendanceNotification;
use App\Notifications\StudentAttendanceNotification;
use App\Services\FcmService;
use Illuminate\Support\Facades\Log;

class AttendanceRepository implements AttendanceRepositoryInterface
{
    public function index() {}

    // get all students based on their sections
    public function show_groups()
    {


        $grades = Grade::with(['sections.students' => function ($query) {
            $query->count();
        }])->get();

        return view('dashboards.admin.Attendance.show_groups', compact('grades'));
    }


    public function show($sectionId)
    {
        // get students by section
        $students = Student::with('attendance')->where('section_id', $sectionId)->get();
        $section = Section::find($sectionId);
        return view('dashboards.admin.Attendance.attendance', compact('students', 'section'));
    }


    public function student_attendance($studentId)
    {
        $attendances = Attendance::where('student_id', $studentId)->get();
        return view('dashboards.admin.Attendance.attendance_report', compact('attendances'));
    }

    public function show_attendance_degree($section_id, $attendance_date)
    {
        $attendances = Attendance::where('section_id', $section_id)
            ->where('attendance_date', $attendance_date)->get();
        $students = Student::with('attendance')->where('section_id', $section_id)->get();
        return view('dashboards.admin.Attendance.show_attendance_degree', compact('attendances', 'students', 'attendance_date'));
    }



    public function store($request)
    {
        try {

            foreach ($request->attendances as $studentId => $attendance) {
                $note = $request->notes[$studentId] ?? null;
                $attendance_date = $request->attendance_date[$studentId] ?? null;


                Attendance::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'attendance_date' => $attendance_date,
                    ],
                    [
                        'student_id' => $studentId,
                        'grade_id' => $request->grade_id,
                        'class_id' => $request->class_id,
                        'section_id' => $request->section_id,
                        'attendance_date' => $attendance_date,
                        'attendance_status' => $attendance,
                        'notes' => $note
                    ]
                );
            }

            // toastr()->success(trans('messages.success'));
            return redirect()->back()->with('toast_success', 'attendance saved successfully');
        } catch (\Exception $e) {
            Log::error('Error performing action: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function sendNotifications($studentId)
    {

        $student = Student::find($studentId);
        $parent = $student->parents;
        $studentAttendance = $student->attendance()
            ->where('attendance_date', date('Y-m-d'))
            ->first();

        $student->notify(new StudentAttendanceNotification($studentAttendance));
        $parent->notify(new ParentAttendanceNotification($studentAttendance));

       // Send push notification if subscription exists
       if ($parent->push_subscription) {
        $statusText = $studentAttendance->attendance_status === 'present' ? 'present' : 'absent';
        
        $payload = [
            'notification' => [
                'title' => 'Attendance Update',
                'body'  => "Your child {$student->name} is marked {$statusText} today",
                'icon'  => '/images/notification.png',

            ],
            'data' => [
                'student_id' => $student->id,
                'attendance_id' => $studentAttendance->id,
                'type' => 'attendance_update',
                'unread_count' => $parent->unreadNotifications()->count(),

            ]
        ];
        

        try {
            $subscription = json_decode($parent->push_subscription, true);
            \App\Services\PushService::sendNotification($subscription, $payload);
        } catch (\Exception $e) {
            Log::error("Push notification failed for parent {$parent->id}: " . $e->getMessage());
            // Optional: Clear invalid subscription
            // $parent->update(['push_subscription' => null]);
        }
    }

        return  redirect()->back()->with('toast_success', 'notification send successfully');
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

    public function choose_attendance_day($section_id)
    {
        $attendances = Attendance::where('section_id', $section_id)->get();
        return view('dashboards.admin.Attendance.choose_attendance_day', compact('attendances'));
    }

    public function show_attendance($section_id, $date)
    {
        $attendances = Attendance::where('section_id', $section_id)
        ->where('attendance_date', $date)->get();
        $section = Section::find($section_id);
        $students = Student::with('attendance')->where('section_id', $section_id)->get();
        return view('dashboards.admin.Attendance.show_attendance', compact('attendances', 'section', 'students','date'));
    }


    public function update($request) {}

    public function destroy($request) {}
}
