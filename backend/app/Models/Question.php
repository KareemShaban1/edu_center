<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'grade_id',
        'question_text',
        'type',
        'correct_answer',
        'lesson_id'
    ];

    public function answers()
    {
        return $this->hasMany('App\Models\Answer', 'question_id');
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

}
