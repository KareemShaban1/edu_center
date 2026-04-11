<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class Section extends Model
{
    // use HasTranslations;
    // public $translatable = ['section_name'];
    protected $fillable = ['section_name', 'grade_id', 'class_id'];

    protected $table = 'sections';
    public $timestamps = true;


    ////////////   Relationships   ////////////

    public function class()
    {
        return $this->belongsTo('App\Models\Classes', 'class_id');
    }

    public function teachers()
    {
        return $this->belongsToMany('App\Models\Teacher', 'teacher_section');
    }

    public function grade()
    {
        return $this->belongsTo('App\Models\Grade', 'grade_id');
    }

    public function students()
    {
        return $this->hasMany('App\Models\Student', 'section_id');
    }

    public function quizzes()
    {
        return $this->hasMany('App\Models\QuizDegree', 'section_id');
    }

    public function exams()
    {
        return $this->hasMany('App\Models\ExamDegree', 'section_id');
    }

    public function attendance()
    {
        return $this->hasMany('App\Models\Attendance', 'section_id');
    }

    public function notes()
    {
        return $this->hasMany('App\Models\Note', 'noteable_id');
    }
    ///////////////////////////////////////////////////////////
}
