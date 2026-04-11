<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Translatable\HasTranslations;

class Student extends Authenticatable implements HasMedia
{
    use InteractsWithMedia;

    use SoftDeletes;

    use Notifiable;

    // use HasTranslations;
    // public $translatable = ['name'];
    protected $guarded = [];

    public function getFilesAttribute()
    {
        return $this->getMedia('student')->map(function ($media) {
            return [
                'id' => $media->id,
                'filename' => $media->file_name,
                'url' => $media->getUrl(),
                'created_at' => $media->created_at,
            ];
        });
    }

    ////////////   Relationships   ////////////


    public function grade()
    {
        return $this->belongsTo('App\Models\Grade', 'grade_id');
    }


    public function class()
    {
        return $this->belongsTo('App\Models\Classes', 'class_id')->withDefault();
    }


    public function section()
    {
        return $this->belongsTo('App\Models\Section', 'section_id')->withDefault();
    }


    public function images()
    {
        return $this->morphMany('App\Models\Image', 'imageable');
    }


    public function parents()
    {
        return $this->belongsTo('App\Models\Parents', 'parent_id');
    }
    public function student_account()
    {
        return $this->hasMany('App\Models\StudentAccount', 'student_id');
    }

    public function attendance()
    {
        return $this->hasMany('App\Models\Attendance', 'student_id');
    }

    public function payment()
    {
        return $this->hasMany('App\Models\Payment', 'student_id');
    }

    public function quiz()
    {
        return $this->hasMany('App\Models\QuizDegree', 'student_id');
    }

    public function exam()
    {
        return $this->hasMany('App\Models\ExamDegree', 'student_id');
    }

    public function notes()
    {
        return $this->morphMany(Note::class, 'noteable');
    }

    public function homework()
    {
        return $this->hasMany(StudentHomework::class, 'student_id');
    }

    ///////////////////////////////////////////////////////////////


    public function receivesBroadcastNotificationsOn()
    {
        return 'student.' . $this->id;
    }

}
