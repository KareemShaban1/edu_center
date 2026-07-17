<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $connection = 'center';

    protected $fillable = [
        'center_id',
        'key',
        'value',
    ];
}
