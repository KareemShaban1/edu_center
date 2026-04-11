<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Homework extends Model
{
    use HasFactory;

    protected $table = 'homeworks';
    protected $fillable = [
        'title',
        'content',
        'grade_id',
        'class_id',
        'section_id',
        'submit_date',
        'due_date',
    ];


    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }


    public function class()
    {
        return $this->belongsTo(Classes::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function studentHomework()
    {
        return $this->hasOne(StudentHomework::class);
    }
}
