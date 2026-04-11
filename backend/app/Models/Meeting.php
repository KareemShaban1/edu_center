<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    protected $fillable = [
        'series_id',
        'grade_id',
        'class_id',
        'section_id',
        'created_by',
        'topic',
        'start_at',
        'duration',
        'provider',
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

    public function series()
    {
        return $this->belongsTo(MeetingSeries::class, 'series_id');
    }
}
