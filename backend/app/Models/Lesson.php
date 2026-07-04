<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Lesson extends Model implements HasMedia
{
    use BelongsToCenter;
    use HasFactory;
    use InteractsWithMedia;

    protected $connection = 'center';

    protected $fillable = [
        'name',
        'unit_id',
        'notes',
        'center_id',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('lessons');
    }

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
