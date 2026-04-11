<?php

namespace App\Repository\Admin;

interface TeacherRepositoryInterface
{

    // get all Teachers
    public function index();

    public function create();

    // StoreTeachers
    public function store($request);

    // StoreTeachers
    public function edit($id);

    // UpdateTeachers
    public function update($request);

    // DeleteTeachers
    public function destroy($request);
}
