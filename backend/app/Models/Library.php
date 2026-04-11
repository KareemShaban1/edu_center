<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Library extends Model implements HasMedia 
{
    use InteractsWithMedia;
    protected $table= "library";

    protected $fillable=['grade_id'];

    public function getLibraryAttribute()
    {
        return $this->getMedia('library')->map(function ($media) {
            return $media->getUrl();
        })->toArray();
    }


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

    ////////////////////////////////////////////////////////


}
