<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Repository\Admin\AnnouncementRepositoryInterface;

class AnnouncementsController extends Controller
{
    
    protected $announcement;

    public function __construct(AnnouncementRepositoryInterface $announcement)
    {
        $this->announcement = $announcement;
    }

    public function index()
    {
        return $this->announcement->index();
    }
    public function create()
    { 

        return $this->announcement->create();
    }

    public function store(StoreAnnouncementRequest $request)
    {

        return $this->announcement->store($request);
    }



    public function edit(Announcement $announcement)
    {
        return $this->announcement->edit($announcement);
    }


    public function update(UpdateAnnouncementRequest $request, $id)
    {

        return $this->announcement->update($request, $id);
    }



    public function destroy($id)
    {
        return $this->announcement->destroy($id);
    }
}
