<?php

namespace App\Repository\Admin;

interface QuizDegreeRepositoryInterface
{
    public function showGroups();

    public function show($id);

    public function edit($id);

    public function choose_quiz_day($id);

    public function show_quiz_degree($section_id, $date);

    public function store_update_quiz_degree($request);

    public function store($request);

    public function update($request);

    public function destroy($request);

    public function sendNotifications($studentId);

    public function sendWhatsappMessage($studentId);


}
