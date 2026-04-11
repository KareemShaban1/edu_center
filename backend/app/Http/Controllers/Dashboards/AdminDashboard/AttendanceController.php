<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Repository\Admin\AttendanceRepositoryInterface;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{

    protected $attendance;

    public function __construct(AttendanceRepositoryInterface $attendance)
    {
        $this->attendance = $attendance;
    }


    public function index()
    {
        return $this->attendance->index();
    }

    public function show_groups()
    {
        return $this->attendance->show_groups();
    }


    public function store(Request $request)
    {
        return $this->attendance->store($request);
    }


    public function show($id)
    {
        return $this->attendance->show($id);
    }

    public function student_attendance($id)
    {

        return $this->attendance->student_attendance($id);
    }

    public function sendNotifications($studentId)
    {

        return $this->attendance->sendNotifications($studentId);
    }


    public function sendWhatsappMessage($studentId)
    {
        $whatsappUrl = $this->attendance->sendWhatsappMessage($studentId);
        return redirect()->away($whatsappUrl);
    }

    public function choose_attendance_day($section_id)
    {
        return $this->attendance->choose_attendance_day($section_id);
    }

    public function show_attendance($section_id, $date)
    {
        return $this->attendance->show_attendance($section_id, $date);
    }

    public function edit($id)
    {
        //
    }


    public function update(Request $request, $id)
    {
        //
    }


    public function destroy($id)
    {
        //
    }
}
