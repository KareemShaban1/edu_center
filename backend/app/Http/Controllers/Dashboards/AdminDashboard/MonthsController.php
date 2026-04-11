<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use Illuminate\Http\Request;
use App\Models\Months;
use App\Http\Controllers\Controller;
class MonthsController extends Controller
{
    //

    public function add(){
        return view('dashboards.admin.months.add');
    }


    public function store(Request $request){

        
        $months = new Months;
        $months->title = $request->title;
        $months->value = $request->value;
        $months->save();

        return redirect()->route('dashboard');
        
    }

}
