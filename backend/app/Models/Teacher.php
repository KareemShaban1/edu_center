<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Translatable\HasTranslations;

class Teacher extends  Authenticatable
{
    use BelongsToCenter;
 
    protected $guarded = [];

    protected $connection = 'center';


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
