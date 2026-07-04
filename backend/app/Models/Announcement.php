<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Announcement extends Model implements HasMedia
{
    use BelongsToCenter;
    use InteractsWithMedia;
    use SoftDeletes;

    protected $connection = 'center';

    protected $fillable = [
        'center_id',
        'grade_id',
        'class_id',
        'section_id',
        'title',
        'body',
        'time',
        'announcement_type',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('announcements');
    }

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
}
