<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Library extends Model implements HasMedia
{
    use BelongsToCenter;
    use InteractsWithMedia;
    use SoftDeletes;

    protected $connection = 'center';

    protected $table = 'library';

    protected $fillable = [
        'title',
        'grade_id',
        'class_id',
        'section_id',
        'type',
        'notes',
        'center_id',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('library');
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
