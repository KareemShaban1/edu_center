<?php

namespace App\Repository\Admin;

use App\Http\Requests\StoreSectionRequest;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\Note;
use App\Models\Section;
use App\Models\Teacher;
use Illuminate\Http\Request;

class SectionRepository implements SectionRepositoryInterface
{

    public function index()
    {
        $grades = Grade::with('sections', 'sections.class')
            ->select('id', 'grade_name')
            ->get();
        $teachers = Teacher::select('id', 'name')->get();
        return view('dashboards.admin.sections.index', compact('grades', 'teachers'));
    }

    public function details($id)
    {
        $section = Section::with('grade','class','students','quizzes','exams','attendance')->findOrFail($id);

        return view('dashboards.admin.sections.details', compact('section'));
    }


    public function store(StoreSectionRequest $request)
    {
        try {


            $request->validated();
            $section = new Section();
            $section->section_name = $request->section_name;
            $section->grade_id = $request->grade_id;
            $section->class_id = $request->class_id;
            $section->status = 1;
            $section->save();
            $section->teachers()->attach($request->teacher_id);

            return redirect()->route('sections.index')->with('toast_success', 'Section added successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }



    public function update(StoreSectionRequest $request)
    {

        try {
            $request->validated();
            $section = Section::findOrFail($request->id);

            $section->section_name = $request->section_name;
            $section->grade_id = $request->grade_id;
            $section->class_id = $request->class_id;

            if (isset($request->status)) {
                $section->status = 1;
            } else {
                $section->Status = 2;
            }


            // update pivot tABLE
            if (isset($request->teacher_id)) {
                $section->teachers()->sync($request->teacher_id);
            } else {
                $section->teachers()->sync(array());
            }


            $section->save();

            return redirect()->route('sections.index')->with('toast_success', 'Section updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }


    public function destroy(Request $request)
    {

        Section::findOrFail($request->id)->delete();
        return redirect()->route('sections.index');
    }

    public function getclasses($id)
    {
        $list_classes = Classes::where("Grade_id", $id)->pluck("Name_Class", "id");

        return $list_classes;
    }

    public function getsections($id)
    {
        $list_sections = Section::where("class_id", $id)->pluck("section_name", "id");

        return $list_sections;
    }

    public function notes($id)
    {
        $notes = Note::where('noteable_id', $id)
        ->where('noteable_type', 'App\Models\Section')
        ->get();
        return view('dashboards.admin.sections.notes', compact('notes'));
    }

}
