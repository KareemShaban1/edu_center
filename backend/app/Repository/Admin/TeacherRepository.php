<?php

namespace App\Repository\Admin;

use App\Models\Section;
use App\Models\Teacher;
use Exception;
use Illuminate\Support\Facades\Hash;

class TeacherRepository implements TeacherRepositoryInterface
{

    public function index()
    {
        $teachers = Teacher::all();
        return view('dashboards.admin.teachers.index', compact('teachers'));
    }

    public function create()
    {
        $sections = Section::all();
        return view('dashboards.admin.teachers.create', compact('sections'));
    }


    public function store($request)
    {

        // try {
        $teacher = new Teacher();
        $teacher->email = $request->email;
        $teacher->password =  Hash::make($request->password);
        $teacher->name = $request->name;
        $teacher->gender = $request->gender;
        $teacher->joining_date = $request->joining_date;
        $teacher->address = $request->address;
        $teacher->phone = $request->phone;
        $teacher->subject = $request->subject;
        $sectionIds = $request->input('section_ids');
        $teacher->save();

        $teacher->sections()->sync($sectionIds);
        return redirect()->route('teachers.index');
        // } catch (Exception $e) {
        //     return redirect()->back()->with(['error' => $e->getMessage()]);
        // }
    }


    public function edit($id)
    {
        $teacher = Teacher::findOrFail($id);
        $sections = Section::all();

        return view('dashboards.admin.teachers.edit', compact('teacher', 'sections'));
    }


    public function update($request)
    {
        try {
            $teacher = Teacher::findOrFail($request->id);
            $teacher->email = $request->email;
            $teacher->password = $request->password ? Hash::make($request->password) : $teacher->password;
            $teacher->name = $request->name;
            $teacher->gender = $request->gender;
            $teacher->joining_date = $request->joining_date;
            $teacher->address = $request->address;
            $teacher->phone = $request->phone;
            $teacher->subject = $request->subject;
            $sectionIds = $request->input('section_ids');
            $teacher->save();
            $teacher->sections()->sync($sectionIds);
            return redirect()->route('teachers.index');
        } catch (Exception $e) {
            return redirect()->back()->with(['error' => $e->getMessage()]);
        }
    }


    public function destroy($request)
    {
        Teacher::findOrFail($request->id)->delete();
        return redirect()->route('teachers.index');
    }
}
