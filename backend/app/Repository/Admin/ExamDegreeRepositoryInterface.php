<?php

namespace App\Repository\Admin;

interface ExamDegreeRepositoryInterface
{
    public function showGroups();

    public function storeUpdateExamDegree($request);

    public function show($id);

    public function choose_exam_day($id);

    public function show_exam_degree($section_id, $date);

    public function sendNotifications($studentId);

    public function sendWhatsappMessage($studentId);




    // public function edit($id);

    // public function update($request);

    // public function destroy($request);

}
