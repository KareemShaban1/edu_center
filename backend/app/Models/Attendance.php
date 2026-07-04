<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = [
        'student_id',
        'grade_id',
        'class_id',
        'section_id',
        'session_id',
        'teacher_id',
        'attendance_date',
        'attendance_status',
        'notes'
    ];

    protected $casts = [
        'attendace_status' => 'boolean',
    ];


    ////////////   Relationships   ////////////

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }


    public function gender()
    {
        return $this->belongsTo(Gender::class, 'gender_id');
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

    ///////////////////////////////////////////////////////
}