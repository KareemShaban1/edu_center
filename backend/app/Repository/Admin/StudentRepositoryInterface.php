<?php

namespace App\Repository\Admin;

interface StudentRepositoryInterface{


    public function index();

    public function data();


    public function create();

    public function store($request);

    public function edit($id);

    public function update($request);

    public function show($id);

    public function delete($request);

    public function Upload_attachment($request,$studentId);

    public function deleteFile($id);

    public function Download_attachment($studentsname,$filename);

    public function Delete_attachment($request);

}


