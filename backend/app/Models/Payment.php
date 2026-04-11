<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'student_id',
        'grade_id',
        'class_id',
        'section_id',
        'fee_id',
        'amount',
        'month',
        'payment_date',
        'payment_status',
        'notes'
    ];

    


    ////////////   Relationships   ////////////


    public function student()
    {
        return $this->belongsTo('App\Models\Student', 'student_id');
    }

    public function fee()
    {
        return $this->belongsTo('App\Models\Fee', 'fee_id');
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

    ////////////////////////////////////////////////////////
}
