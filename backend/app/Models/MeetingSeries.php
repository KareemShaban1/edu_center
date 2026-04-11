<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingSeries extends Model
{
    protected $fillable = [
        'teacher_id',
        'created_by',
        'grade_id',
        'class_id',
        'section_id',
        'topic',
        'provider',
        'week_days',
        'start_date',
        'end_date',
        'start_time',
        'duration',
        'record_enabled',
        'join_url',
        'moderator_url',
        'password',
        'external_ref',
        'location',
        'notes',
        'status',
    ];

    protected $casts = [
        'record_enabled' => 'boolean',
        'week_days' => 'array',
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

    public function meetings()
    {
        return $this->hasMany(Meeting::class, 'series_id');
    }
}

