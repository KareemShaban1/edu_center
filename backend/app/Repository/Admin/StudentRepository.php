<?php

namespace App\Repository\Admin;

use App\Models\Gender;
use App\Models\Grade;
use App\Models\Image;
use App\Models\Parents;
use App\Models\Student;
use App\Centers\CenterMembershipService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Yajra\DataTables\Facades\DataTables;

class StudentRepository implements StudentRepositoryInterface
{


    public function index()
    {
        $students = Student::all();
        return view('dashboards.admin.students.index', compact('students'));
    }

    public function data()
    {
        $students = Student::with(['grade', 'class', 'section']);

        return DataTables::of($students)
            ->addIndexColumn()
            ->addColumn('actions', function ($student) {
                return view(
                    'dashboards.admin.students.partials.actions',
                    compact('student')
                )->render();
            })
            ->editColumn('name', function ($student) {
                return $student->name;
            })
            ->editColumn('gender', function ($student) {
                return trans('admin/students_trans.' . $student->gender) ;
            })
            ->editColumn('grade.grade_name.ar', function ($student) {
                return $student->grade ? ($student->grade->grade_name['ar'] ?? $student->grade->grade_name) : '';
            })
            ->editColumn('class.class_name.ar', function ($student) {
                return $student->class ? ($student->class->class_name['ar'] ?? $student->class->class_name) : '';
            })
            ->editColumn('section.section_name.ar', function ($student) {
                return $student->section ? ($student->section->section_name['ar'] ?? $student->section->section_name) : '';
            })
            ->rawColumns(['actions'])
            ->make(true);
    }




    public function create()
    {


        $data['grades'] = Grade::all();
        $data['parents'] = Parents::all();
        $data['Genders'] = Gender::all();
        return view('dashboards.admin.students.add', $data);
    }


    public function store($request)
    {


        DB::beginTransaction();

        try {
            $student = new Student();
            $student->name = $request->name;
            $student->email = $request->email;
            $student->password = Hash::make($request->password);
            $student->grade_id = $request->grade_id;
            $student->class_id = $request->class_id;
            $student->section_id = $request->section_id;
            $student->parent_id = $request->parent_id;
            $student->academic_year = $request->academic_year;
            $student->gender = $request->gender;
            $student->is_active = $request->is_active ? 1 : 0;
            $student->save();

            app(CenterMembershipService::class)->registerStudentProfile((int) $student->id);

            // insert img
            if ($request->hasfile('photos')) {
                foreach ($request->file('photos') as $file) {
                    $name = $file->getClientOriginalName();
                    $file->storeAs('attachments/students/' . $student->name, $file->getClientOriginalName(), 'upload_attachments');

                    // insert in image_table
                    $images = new Image();
                    $images->filename = $name;
                    $images->imageable_id = $student->id;
                    $images->imageable_type = 'App\Models\Student';
                    $images->save();
                }
            }
            DB::commit(); // insert data
            return redirect()->route('students.index')->with('toast_success', 'Student created successfully');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withInput()->withErrors(['toast_error' => $e->getMessage()]);
        }
    }


    public function show($id)
    {
        $Student = Student::findorfail($id);
        return view('dashboards.admin.students.show', compact('Student'));
    }


    public function edit($id)
    {
        $data['grades'] = Grade::all();
        $data['parents'] = Parents::all();
        $data['genders'] = Gender::all();
        $student =  Student::findOrFail($id);
        return view('dashboards.admin.students.edit', $data, compact('student'));
    }

    public function update($request)
    {
        try {
            $student = Student::findorfail($request->id);
            $student->name = $request->name;
            $student->email = $request->email;
            $student->password = $request->password ? Hash::make($request->password) : $student->password;
            $student->grade_id = $request->grade_id;
            $student->class_id = $request->class_id;
            $student->section_id = $request->section_id;
            $student->parent_id = $request->parent_id;
            $student->academic_year = $request->academic_year;
            $student->gender = $request->gender;
            $student->is_active = $request->is_active ? 1 : 0;
            $student->save();
            return redirect()->route('students.index')->with('toast_success','Student updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['toast_error' => $e->getMessage()]);
        }
    }




    public function delete($request)
    {

        Student::destroy($request->id);
        return redirect()->route('students.index')->with('toast_success','Student deleted successfully');
    }

    public function Upload_attachment($request, $studentId)
    {
        // foreach ($request->file('photos') as $file) {
        //     $name = $file->getClientOriginalName();
        //     $file->storeAs('attachments/students/' . $request->student_name, $file->getClientOriginalName(), 'upload_attachments');

        //     // insert in image_table
        //     $images = new image();
        //     $images->filename = $name;
        //     $images->imageable_id = $request->student_id;
        //     $images->imageable_type = 'App\Models\Student';
        //     $images->save();
        // }

        $student = Student::findOrFail($studentId);

        if ($request->hasFile('files')) {
            $student->clearMediaCollection('student');
            foreach ($request->file('files') as $file) {
                $student->addMedia($file)
                    ->toMediaCollection('student');
            }
        }

        return redirect()->route('students.show', $request->student_id);
    }

    public function Download_attachment($studentsname, $filename)
    {
        return response()->download(public_path('attachments/students/' . $studentsname . '/' . $filename));
    }

    public function deleteFile($id)
    {
        $file = Media::findOrFail($id);
        $file->delete();

        return back()->with('success', trans('admin/students_trans.file_deleted_successfully'));
    }

    public function Delete_attachment($request)
    {
        // Delete img in server disk
        Storage::disk('upload_attachments')->delete('attachments/students/' . $request->student_name . '/' . $request->filename);

        // Delete in data
        image::where('id', $request->id)->where('filename', $request->filename)->delete();
        return redirect()->route('students.show', $request->student_id);
    }
}
