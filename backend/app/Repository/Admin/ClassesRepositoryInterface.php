<?php

namespace App\Repository\Admin;

use Illuminate\Http\Request;

interface ClassesRepositoryInterface
{
    public function index();

    public function notes($id);

    public function create();

    public function store(Request $request);

    public function show($id);

    public function edit($id);

    public function update(Request $request);

    public function destroy(Request $request);

    public function classQuestions($id);

    public function printQuestions($id);

    public function questionModel($id);

    public function classUnitsLessons($id);

    public function lessonQuestions($id);


}
