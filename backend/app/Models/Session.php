<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $table = 'sessions';

    protected $fillable = [
        'grade_id',
        'class_id',
        'section_id',
        'created_by',
        'topic',
        'session_type',
        'provider',
        'start_at',
        'duration',
        'room_slug',
        'join_url',
        'moderator_url',
        'password',
        'record_enabled',
        'external_ref',
        'location',
        'notes',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'record_enabled' => 'boolean',
    ];

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

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'session_id');
    }

    public function examDegrees()
    {
        return $this->hasMany(ExamDegree::class, 'session_id');
    }

    public function quizDegrees()
    {
        return $this->hasMany(QuizDegree::class, 'session_id');
    }
}
