<?php


namespace App\Repository\Admin;

use App\Models\Classes;
use App\Models\Grade;
use App\Models\Lesson;
use App\Models\Note;
use Illuminate\Http\Request;

class ClassesRepository implements ClassesRepositoryInterface
{


    public function index()
    {

        $classes = Classes::all();
        $grades = Grade::all();
        return view('dashboards.admin.classes.index', compact('classes', 'grades'));
    }


    public function create() {}





    public function store($request)
    {

        $classes_list = $request->Classes_List;

        try {


            foreach ($classes_list as $my_class) {

                $class = new Classes();

                $class->class_name = $my_class['class_name'];

                $class->grade_id = $my_class['grade_id'];

                $class->save();
            }

            return redirect()->route('classes.index')
                ->with('toast_success', __('admin/classes_trans.Class_added_successfully'));
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('toast_error', __('admin/classes_trans.Class_added_failed'))
                ->withErrors(['error' => $e->getMessage()]);
        }
    }


    public function show($id) {}


    public function edit($id) {}


    public function update(Request $request)
    {

        try {

            $class = Classes::findOrFail($request->id);

            $class->update([

                $class->class_name = $request->class_name,
                $class->grade_id = $request->grade_id,
            ]);
            return redirect()->route('classes.index')
                ->with('toast_success', __('admin/classes_trans.Class_updated_successfully'));
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('toast_error', __('admin/classes_trans.Class_updated_failed'))
                ->withErrors(['error' => $e->getMessage()]);
        }
    }


    public function destroy(Request $request)
    {

        $class = Classes::findOrFail($request->id)->delete();
        return redirect()->route('classes.index')
            ->with('toast_success', __('admin/classes_trans.Class_deleted_successfully'));
    }

    public function notes($id)
    {
        $notes = Note::where('noteable_id', $id)
            ->where('noteable_type', 'App\Models\Classes')
            ->get();
        return view('dashboards.admin.classes.notes', compact('notes'));
    }

    public function classQuestions($id)
    {
        $class = Classes::findOrFail($id);
        $questions = $class->questions;
        $lessons = Lesson::all();

        return view('dashboards.admin.classes.classQuestions', compact('class', 'questions', 'lessons'));
    }

    public function printQuestions($id)
    {
        $class = Classes::findOrFail($id);
        $questions = $class->questions;
        return view('dashboards.admin.classes.printQuestions', compact('class', 'questions'));
    }

    public function questionModel($id)
    {
        $class = Classes::findOrFail($id);
        $questions = $class->questions;
        return view('dashboards.admin.classes.questionModel', compact('class', 'questions'));
    }

    public function classUnitsLessons($id)
    {
        $class = Classes::findOrFail($id);
        $units = $class->units;
        $lessons = $class->lessons;
        return view('dashboards.admin.classes-units-lessons.index', compact('class', 'lessons', 'units'));
    }

    public function lessonQuestions($id)
    {
        $lesson = Lesson::findOrFail($id);
        $questions = $lesson->questions;
        return view('dashboards.admin.classes-units-lessons.lessonQuestions', compact('lesson', 'questions'));
    }
}
