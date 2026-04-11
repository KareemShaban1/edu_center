<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Section;
use App\Models\Fee;

class AjaxController extends Controller
{
    // Get Classrooms
    public function Get_Classes($id)
    { 
        return Classes::where("grade_id", $id)->pluck("class_name", "id");

    }

    //Get Sections
    public function Get_Sections($class_id,$grade_id){
        $sections = Section::where("class_id", $class_id)
        ->where('grade_id',$grade_id)
        ->pluck("section_name", "id") ; 
        return $sections;

    }

    public function Get_amount($id)
    {
        $list_fee = Fee::where("id", $id)->pluck("amount","amount");
        return $list_fee;
    }

}
