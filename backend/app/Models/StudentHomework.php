<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class StudentHomework extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'student_id', 'homework_id', 'upload_date_time', 'status',
        'degree', 'rate', 'student_notes', 'response'
    ];

    protected $dates = ['upload_date_time'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function homework()
    {
        return $this->belongsTo(Homework::class);
    }
}
