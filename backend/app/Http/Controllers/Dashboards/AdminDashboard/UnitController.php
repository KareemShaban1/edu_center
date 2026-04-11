<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUnitRequest;
use App\Http\Requests\UpdateUnitRequest;
use App\Repository\Admin\UnitRepositoryInterface;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    //
    protected $units;

    public function __construct(UnitRepositoryInterface $units)
    {
        $this->units = $units;
    }

    public function index()
    {
        return $this->units->index();
    }

    public function store(StoreUnitRequest $request)
    {
        return $this->units->store($request);
    }

    public function update(UpdateUnitRequest $request)
    {
        return $this->units->update($request);
    }

    public function destroy(Request $request)
    {
        return $this->units->destroy($request);
    }
}
