<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class Classes extends Model
{
    use BelongsToCenter;

    // use HasTranslations;
    // public $translatable = ['class_name'];

    protected $table = 'classes';
    protected $connection = 'center';
    public $timestamps = true;
    protected $fillable=['class_name','grade_id'];



    ////////////   Relationships   ////////////
    
    public function grade()
    {
        return $this->belongsTo('App\Models\Grade', 'grade_id');
    }

    public function notes()
    {
        return $this->hasMany('App\Models\Note', 'noteable_id');
    }

    public function questions()
    {
        return $this->hasMany('App\Models\Question', 'class_id');
    }

    public function units()
    {
        return $this->hasMany('App\Models\Unit', 'class_id');
    }

    public function words()
    {
        return $this->hasMany('App\Models\Word', 'class_id');
    }


    //////////////////////////////////////////

}
