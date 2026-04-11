<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
class HomeController extends Controller
{


    public function index()
    {
        return view('auth.selection');
    }

    public function calendar(){
        return view('dashboards.admin.calendar');
    }

    public function dashboard()
    {
        return view('dashboards.admin.Dashboard.index');
    }
}
 