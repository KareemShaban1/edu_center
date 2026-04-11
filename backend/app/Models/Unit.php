<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'class_id',
        'notes',
    ];

    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    public function classes()
    {
        return $this->belongsTo(Classes::class , 'class_id', 'id');
    }


}
