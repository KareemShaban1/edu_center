<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMeetingRequest;
use App\Repository\Admin\MeetingsRepositoryInterface;
class MeetingsController extends Controller
{
    public function __construct(protected MeetingsRepositoryInterface $meetings)
    {
    }

    public function index()
    {
        return $this->meetings->index();
    }

    public function create()
    {
        return $this->meetings->create();
    }

    public function indirectCreate()
    {
        return $this->meetings->indirectCreate();
    }

    public function store(StoreMeetingRequest $request)
    {
        return $this->meetings->store($request);
    }

    public function storeIndirect(StoreMeetingRequest $request)
    {
        return $this->meetings->storeIndirect($request);
    }

    public function show($id)
    {
        return $this->meetings->show($id);
    }

    public function edit($id)
    {
        return $this->meetings->edit($id);
    }

    public function update(StoreMeetingRequest $request, $id)
    {
        return $this->meetings->update($request, $id);
    }

    public function destroy($id)
    {
        return $this->meetings->destroy((int) $id);
    }
}
