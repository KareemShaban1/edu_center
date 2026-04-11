<?php

namespace App\Repository\Admin;

interface MeetingsRepositoryInterface
{
    public function index();

    public function create();

    public function indirectCreate();

    public function store($request);

    public function storeIndirect($request);

    public function show($id);

    public function edit($id);

    public function update($request, $id);

    public function destroy(int $id);
}
