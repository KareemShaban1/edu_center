<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamDegree extends Model
{
    use HasFactory;

    protected $table = 'exam_degrees';

    protected $fillable = [
        'student_id',
        'section_id',
        'class_id',
        'grade_id',
        'session_id',
        'exam_date',
        'degree',
        'final_degree',
        'notes'
    ];



    ////////////   Relationships   ////////////

    public function students()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }


    public function grade()
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_id');
    }

    public function notes()
    {
        return $this->hasMany('App\Models\Note', 'noteable_id');
    }
    ////////////////////////////////////////////
}
