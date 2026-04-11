<?php


namespace App\Repository\Admin;


interface AttendanceRepositoryInterface 
{
    public function index();

    public function show_groups();

    public function show($id);

    public function student_attendance($id);

    public function sendNotifications($studentId);

    public function sendWhatsappMessage($studentId);

    public function choose_attendance_day($section_id);

    public function show_attendance($section_id, $date);

    public function store($request);

    public function update($request);

    public function destroy($request);

}
