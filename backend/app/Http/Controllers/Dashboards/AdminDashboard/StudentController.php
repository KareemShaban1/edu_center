<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentsRequest;
use App\Http\Requests\UpdateStudentsRequest;
use App\Imports\StudentsImport;
use App\Repository\Admin\StudentRepositoryInterface;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class StudentController extends Controller
{

    protected $student;

    public function __construct(StudentRepositoryInterface $student)
    {
        $this->student = $student;
    }


    public function index()
    {
        return $this->student->index();
    }

    public function data()
    {
        return $this->student->data();
    }


    public function create()
    {
        return $this->student->create();
    }

    public function store(StoreStudentsRequest $request)
    {
        return $this->student->store($request);
    }

    public function show($id)
    {

        return $this->student->show($id);
    }


    public function edit($id)
    {
        return $this->student->edit($id);
    }


    public function update(UpdateStudentsRequest $request)
    {
        return $this->student->update($request);
    }


    public function destroy(Request $request)
    {
        return $this->student->delete($request);
    }


    public function Upload_attachment(Request $request,$studentId)
    {
        return $this->student->Upload_attachment($request,$studentId);
    }

    public function deleteFile($id)
    {
        return $this->student->deleteFile($id);
    }

    public function Download_attachment($studentsname, $filename)
    {
        return $this->student->Download_attachment($studentsname, $filename);
    }

    public function Delete_attachment(Request $request)
    {
        return $this->student->Delete_attachment($request);
    }

    public function importPage()
    {
        return view('dashboards.admin.students.import');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls',
        ]);
    
        $import = new StudentsImport();
        Excel::import($import, $request->file('file'));
    
        return back()->with([
            'toast_success' => 'Students imported!',
            'imported' => $import->imported,
            'skipped'  => $import->skipped,
        ]);
    }


}
