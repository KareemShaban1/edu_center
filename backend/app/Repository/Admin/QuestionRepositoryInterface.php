<?php


namespace App\Repository\Admin;

interface QuestionRepositoryInterface
{
    public function showGroups();

    public function show($id);

    public function edit($id);

    public function store($request);

    public function update($request);

    public function destroy($request);
}
