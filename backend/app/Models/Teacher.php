<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Translatable\HasTranslations;

class Teacher extends  Authenticatable
{
 
    protected $guarded = [];


    protected $fillable = [
        'name','email','password','subject','gender','phone','address','joining_date'
    ];

    ////////////   Relationships   ////////////
    
    public function sections()
    {
        return $this->belongsToMany('App\Models\Section', 'teacher_section');
    }
    ///////////////////////////////////////////
    
}
