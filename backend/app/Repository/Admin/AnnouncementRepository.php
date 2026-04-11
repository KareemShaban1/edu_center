<?php

namespace App\Repository\Admin;

use App\Models\Announcement;
use App\Models\Grade;
use App\Repository\Admin\AnnouncementRepositoryInterface;

class AnnouncementRepository implements AnnouncementRepositoryInterface
{
    public function index()
    {
        $announcements = Announcement::all();

        return view('dashboards.admin.announcements.index', compact('announcements'));
    }
    public function create()
    {
        $grades = grade::all();

        return view('dashboards.admin.announcements.add', compact('grades'));
    }

    public function store($request)
    {

        $request->validated();
        $data = $request->all();

        $announcement = Announcement::create($data);

        return redirect()->route('announcements.index')->with('toast_success', __('Announcement added successfully'));
    }

   

    public function edit($announcement)
    {
        $grades = Grade::all();

        return view('dashboards.admin.announcements.edit', compact('announcement', 'grades'));
    }


    public function update($request, $id)
    {


        $announcement = Announcement::findOrFail($id);
        $request->validated();
        $data = $request->all();
        $announcement->update($data);

        return redirect()->route('announcements.index')->with('toast_success', __('Announcement updated successfully'));
    }



    public function destroy($id)
    {
        try {
            $announcement = Announcement::findOrFail($id);
            $announcement->delete();
            return redirect()->back();
        } catch (\Exception $e) {
            return redirect()->back()
            ->with('toast_success', __('Announcement deleted successfully'))
            ->withErrors(['error' => $e->getMessage()]);
        }
    }
}
