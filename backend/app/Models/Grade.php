<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class Grade extends Model
{
    use BelongsToCenter;

    // use HasTranslations;
    // public $translatable = ['grade_name'];

    protected $fillable=['grade_name','notes'];
    protected $table = 'grades';
    protected $connection = 'center';
    public $timestamps = true;

    
    ////////////   Relationships   ////////////

    public function sections()
    {
        return $this->hasMany('App\Models\Section', 'grade_id');
    }

    public function notes()
    {
        return $this->hasMany('App\Models\Note', 'noteable_id');
    }

    ////////////////////////////////////////////

}