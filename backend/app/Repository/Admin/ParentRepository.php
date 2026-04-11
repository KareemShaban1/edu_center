<?php

namespace App\Repository\Admin;

use App\Models\Gender;
use App\Models\Grade;
use App\Models\Image;
use App\Models\Parents;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Yajra\DataTables\Facades\DataTables;

class ParentRepository implements ParentRepositoryInterface
{


    public function index()
    {
        $parents = Parents::all();
        return view('dashboards.admin.parents.index', compact('parents'));
    }

    public function data()
    {
        $parents = Parents::query();

        return DataTables::of($parents)
            ->addIndexColumn()
            ->addColumn('actions', function ($parent) {
                return view(
                    'dashboards.admin.parents.partials.actions',
                    compact('parent')
                )->render();
            })
            ->editColumn('name', function ($parent) {
                return $parent->parent_name;
            })
           
            ->rawColumns(['actions'])
            ->make(true);
    }




    public function create()
    {


        return view('dashboards.admin.parents.create');
    }


    public function store($request)
    {


        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            $validatedData['is_active'] = $request->is_active ? 1 : 0;
            $validatedData['password'] = Hash::make($request->password);
            $parent = Parents::create($validatedData);

            // insert img
            if ($request->hasfile('photos')) {
                foreach ($request->file('photos') as $file) {
                    $name = $file->getClientOriginalName();
                    $file->storeAs('attachments/parents/' . $parent->parent_name, $file->getClientOriginalName(), 'upload_attachments');

                    // insert in image_table
                    $images = new Image();
                    $images->filename = $name;
                    $images->imageable_id = $parent->id;
                    $images->imageable_type = 'App\Models\Parents';
                    $images->save();
                }
            }
            DB::commit(); // insert data
            return redirect()->route('parents.index')->with('toast_success', 'Parent created successfully');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withInput()->withErrors(['toast_error' => $e->getMessage()]);
        }
    }


    public function show($id)
    {
        $Parent = Parents::findorfail($id);
        return view('dashboards.admin.parents.show', compact('Parent'));
    }


    public function edit($id)
    {

        $parent =  Parents::findOrFail($id);
        return view('dashboards.admin.parents.edit', compact('parent'));
    }

    public function update($request,$id)
    {
        try {
            $validatedData = $request->validated();
            $parent = Parents::findorfail($id);
            $validatedData['password'] = $request->password ? Hash::make($request->password) : $parent->password;
            $validatedData['is_active'] = $request->is_active ? 1 : 0;
            $parent->update($validatedData);
            return redirect()->route('parents.index')->with('toast_success', 'Parent updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['toast_error' => $e->getMessage()]);
        }
    }




    public function delete($request)
    {

        Parents::destroy($request->id);
        return redirect()->route('parents.index')->with('toast_success', 'Parent deleted successfully');
    }

    public function Upload_attachment($request, $parentId)
    {
        // foreach ($request->file('photos') as $file) {
        //     $name = $file->getClientOriginalName();
        //     $file->storeAs('attachments/parents/' . $request->parent_name, $file->getClientOriginalName(), 'upload_attachments');

        //     // insert in image_table
        //     $images = new image();
        //     $images->filename = $name;
        //     $images->imageable_id = $request->parent_id;
        //     $images->imageable_type = 'App\Models\Parent';
        //     $images->save();
        // }

        $parent = Parents::findOrFail($parentId);

        if ($request->hasFile('files')) {
            $parent->clearMediaCollection('parent');
            foreach ($request->file('files') as $file) {
                $parent->addMedia($file)
                    ->toMediaCollection('parent');
            }
        }

        return redirect()->route('parents.show', $request->parent_id);
    }

    public function Download_attachment($parentsname, $filename)
    {
        return response()->download(public_path('attachments/parents/' . $parentsname . '/' . $filename));
    }

    public function deleteFile($id)
    {
        $file = Media::findOrFail($id);
        $file->delete();

        return back()->with('success', trans('admin/parent_trans.file_deleted_successfully'));
    }

    public function Delete_attachment($request)
    {
        // Delete img in server disk
        Storage::disk('upload_attachments')->delete('attachments/parents/' . $request->parent_name . '/' . $request->filename);

        // Delete in data
        image::where('id', $request->id)->where('filename', $request->filename)->delete();
        return redirect()->route('parents.show', $request->parent_id);
    }
}
