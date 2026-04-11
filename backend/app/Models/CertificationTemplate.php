<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
class CertificationTemplate extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    protected $fillable = ['title', 'content', 'variables'];

    protected $casts = [
        'variables' => 'array',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('certification_background')->useDisk('public')->acceptsFile(function ($file) {
            return in_array($file->mimeType, ['image/jpeg', 'image/png', 'image/jpg']);
        })->useFallbackUrl('/path/to/default.jpg')->useFallbackPath(public_path('default.jpg'));
        
        // 🔥 Make sure to enable multiple file uploads
        $this->addMediaCollection('certification_background')->onlyKeepLatest(0);
    }


}
