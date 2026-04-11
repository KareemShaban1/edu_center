<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class Fee extends Model
{
    use HasTranslations;
    public $translatable = ['title'];
    protected $fillable=['title','amount','Grade_id','Classroom_id','Section_id','year','description','Fee_type'];


    ////////////   Relationships   ////////////

    public function grade()
    {
        return $this->belongsTo('App\Models\Grade', 'grade_id');
    }

    public function class()
    {
        return $this->belongsTo('App\Models\Classes', 'class_id');
    }

    public function section()
    {
        return $this->belongsTo('App\Models\Section', 'section_id');
    }

    ///////////////////////////////////////////
}
