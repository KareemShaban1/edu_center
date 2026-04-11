<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeachers;
use Illuminate\Http\Request;
use App\Repository\Admin\TeacherRepositoryInterface;

class TeacherController extends Controller
{
    protected $teacher;

    public function __construct(TeacherRepositoryInterface $teacher)
    {
        $this->teacher = $teacher;
    }

    public function index()
    {
        return $this->teacher->index();
        
    }

    public function create()
    {

        return $this->teacher->create();

    }


    public function store(StoreTeachers $request)
    {
        return $this->teacher->store($request);
    }


    public function show($id)
    {
    }


    public function edit($id)
    {
        return $this->teacher->edit($id);
    }


    public function update(Request $request)
    {
        return $this->teacher->update($request);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request)
    {
        return $this->teacher->destroy($request);
    }
}
