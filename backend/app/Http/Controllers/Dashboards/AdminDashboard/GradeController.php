<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGradesRequest;
use App\Repository\Admin\GradeRepositoryInterface;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    protected $grades;

    public function __construct(GradeRepositoryInterface $grades)
    {
        $this->grades = $grades;
    }


    public function index()
    {
        return $this->grades->index();
    }




    public function store(StoreGradesRequest $request)
    {
        return $this->grades->store($request);
    }


    public function update(StoreGradesRequest $request)
    {
        return $this->grades->update($request);
    }




    public function destroy(Request $request)
    {
        return $this->grades->destroy($request);
    }
}
