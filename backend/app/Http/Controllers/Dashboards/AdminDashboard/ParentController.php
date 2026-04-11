<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParentsRequest;
use App\Http\Requests\UpdateParentsRequest;
use App\Imports\ParentsImport;
use App\Repository\Admin\ParentRepositoryInterface;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ParentController extends Controller
{

    protected $parent;

    public function __construct(ParentRepositoryInterface $parent)
    {
        $this->parent = $parent;
    }


    public function index()
    {
        return $this->parent->index();
    }

    public function data()
    {
        return $this->parent->data();
    }


    public function create()
    {
        return $this->parent->create();
    }

    public function store(StoreParentsRequest $request)
    {
        return $this->parent->store($request);
    }

    public function show($id)
    {

        return $this->parent->show($id);
    }


    public function edit($id)
    {
        return $this->parent->edit($id);
    }


    public function update(UpdateParentsRequest $request, $id)
    {
        return $this->parent->update($request, $id);
    }


    public function destroy(Request $request)
    {
        return $this->parent->delete($request);
    }


    public function Upload_attachment(Request $request, $parentId)
    {
        return $this->parent->Upload_attachment($request, $parentId);
    }

    public function deleteFile($id)
    {
        return $this->parent->deleteFile($id);
    }

    public function Download_attachment($parentsname, $filename)
    {
        return $this->parent->Download_attachment($parentsname, $filename);
    }

    public function Delete_attachment(Request $request)
    {
        return $this->parent->Delete_attachment($request);
    }

    public function importPage()
    {
        return view('dashboards.admin.parents.import');
    }


    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls',
        ]);

        $import = new ParentsImport();

        Excel::import($import, $request->file('file'));

        return back()->with([
            'toast_success' => 'Import finished!',
            'imported' => $import->imported,
            'skipped' => $import->skipped,
        ]);
    }
}
