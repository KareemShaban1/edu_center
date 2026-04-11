<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExamDegreeRequest;
use App\Repository\Admin\ExamDegreeRepositoryInterface;

class ExamDegreeController extends Controller
{
    //

    protected $exam;

    public function __construct(ExamDegreeRepositoryInterface $exam)
    {
        $this->exam = $exam;
    }



    public function showGroups()
    {
        return $this->exam->showGroups();
    }



    public function storeUpdateExamDegree(StoreExamDegreeRequest $request)
    {
        return $this->exam->storeUpdateExamDegree($request);
    }


    public function show($id)
    {
        return $this->exam->show($id);
    }



    public function choose_exam_day($id)
    {
        return $this->exam->choose_exam_day($id);
    }

    public function show_exam_degree($section_id, $date)
    {
        return $this->exam->show_exam_degree($section_id, $date);
    }

    public function sendNotifications($studentId)
    {

        return $this->exam->sendNotifications($studentId);
    }


    public function sendWhatsappMessage($studentId)
    {
        $whatsappUrl =  $this->exam->sendWhatsappMessage($studentId);
        return redirect()->away($whatsappUrl);
    }
}
