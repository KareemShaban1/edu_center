<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'noteable_id',
        'noteable_type',
        'title',
        'content',
        'date_time'
    ];

    public function noteable()
    {
        return $this->morphTo();
    }
}
