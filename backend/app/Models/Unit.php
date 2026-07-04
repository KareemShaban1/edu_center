<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Unit extends Model implements HasMedia
{
    use BelongsToCenter;
    use HasFactory;
    use InteractsWithMedia;

    protected $connection = 'center';

    protected $fillable = [
        'name',
        'class_id',
        'notes',
        'center_id',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('units');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    public function classes()
    {
        return $this->belongsTo(Classes::class , 'class_id', 'id');
    }


}
