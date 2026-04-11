<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Http\Requests\StoreLessonRequest;
use App\Http\Requests\UpdateLessonRequest;
use App\Repository\Admin\LessonRepositoryInterface;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    protected $lessons;

    public function __construct(LessonRepositoryInterface $lessons)
    {
        $this->lessons = $lessons;
    }

    public function index()
    {
        return $this->lessons->index();
    }
    public function show($id)
    {
        return $this->lessons->show($id);
    }

    public function store(StoreLessonRequest $request)
    {
        return $this->lessons->store($request);
    }

    public function update(UpdateLessonRequest $request)
    {
        return $this->lessons->update($request);
    }

    public function destroy(Request $request)
    {
        return $this->lessons->destroy($request);
    }

    public function wordsModel($id)
    {
        return $this->lessons->wordsModel($id);
    }
}
