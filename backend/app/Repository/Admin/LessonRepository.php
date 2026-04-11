<?php

namespace App\Repository\Admin;


use App\Http\Requests\StoreGradesRequest;
use App\Http\Requests\StoreLessonRequest;
use App\Http\Requests\UpdateLessonRequest;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\Lesson;
use App\Models\Unit;
use Illuminate\Http\Request;

class LessonRepository implements LessonRepositoryInterface
{


  public function index()
  {
    // get all lessons
    $lessons = Lesson::all();
    $lessons->load('unit', 'unit.classes');
    $units = Unit::all();
    return view('dashboards.admin.lessons.index', compact('lessons', 'units'));
  }

  public function show($id)
  {
    $lesson = Lesson::findOrFail($id);
    $lesson->load('unit', 'questions', 'words');

    return view('dashboards.admin.lessons.show', compact('lesson'));
  }

  public function store(StoreLessonRequest $request)
  {

    try {
      $request->validated();
      $lesson = new Lesson();
      $lesson->name = $request->name;
      $lesson->unit_id = $request->unit_id;
      $lesson->Notes = $request->notes;

      $lesson->save();


      return redirect()->back()
        ->with('toast_success', 'Lesson added successfully');
    } catch (\Exception $e) {
      return redirect()->back()
        ->with('toast_error', __('Lesson added failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }


  public function update(UpdateLessonRequest $request)
  {

    try {

      // $request->validated();
      $lesson = Lesson::findOrFail($request->id);
      $lesson->update([
        $lesson->lesson_name = $request->name,
        $lesson->unit_id = $request->unit_id,
        $lesson->notes = $request->notes,
      ]);
      return redirect()->back()
        ->with('toast_success', 'Lesson Updated successfully');
    } catch (\Exception $e) {
      return redirect()->back()
        ->with('toast_error', __('Lesson updated failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }


  public function destroy(Request $request)
  {
    $lesson = Lesson::findOrFail($request->id)->delete();
    return redirect()->route('lessons.index')
      ->with('toast_success', 'Lesson deleted successfully');
  }

  public function wordsModel($id)
  {
    $lesson = Lesson::findOrFail($id);
    $words = $lesson->words;
    return view('dashboards.admin.lessons.wordsModel', compact('lesson', 'words'));
  }
}
