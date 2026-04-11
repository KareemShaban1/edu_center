<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_name',
        'unit_id',
        'notes',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class)->with('classes');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function words()
    {
        return $this->hasMany(Word::class);
    }
}
