<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuizDegreeRequest;
use App\Repository\Admin\QuizDegreeRepositoryInterface;
use Illuminate\Http\Request;

class QuizDegreeController extends Controller
{
    //

    protected $quiz;

    public function __construct(QuizDegreeRepositoryInterface $quiz)
    {
        $this->quiz = $quiz;
    }


    public function showGroups()
    {
        return $this->quiz->showGroups();
    }



    public function store(Request $request)
    {
        return $this->quiz->store($request);
    }


    public function show($id)
    {
        return $this->quiz->show($id);
    }



    public function choose_quiz_day($id)
    {
        return $this->quiz->choose_quiz_day($id);
    }

    public function show_quiz_degree($section_id, $date)
    {
        return $this->quiz->show_quiz_degree($section_id, $date);
    }

    public function store_update_quiz_degree(StoreQuizDegreeRequest $request)
    {
        //
        return $this->quiz->store_update_quiz_degree($request);
    }

    public function edit($id)
    {
        //
        return $this->quiz->edit($id);
    }


    public function update(Request $request, $id)
    {
        //
        return $this->quiz->update($id);
    }


    public function destroy($id)
    {
        return $this->quiz->destroy($id);
        //
    }

    public function sendNotifications($studentId)
    {

        return $this->quiz->sendNotifications($studentId);
    }


    public function sendWhatsappMessage($studentId)
    {

        $whatsappUrl =  $this->quiz->sendWhatsappMessage($studentId);
        return redirect()->away($whatsappUrl);
    }
}
