<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CertificationTemplate extends Model implements HasMedia
{
    use BelongsToCenter;
    use HasFactory;
    use InteractsWithMedia;

    protected $connection = 'center';

    protected $table = 'certification_templates';

    protected $fillable = ['title', 'content', 'variables', 'is_system', 'design_id', 'design'];

    protected $casts = [
        'variables' => 'array',
        'design' => 'array',
        'is_system' => 'boolean',
    ];

    public function certifications(): HasMany
    {
        return $this->hasMany(StudentCertification::class, 'template_id');
    }

    public function render(array $data): string
    {
        $message = $this->content;
        foreach ($this->variables ?? [] as $key) {
            $message = str_replace('{{'.$key.'}}', $data[$key] ?? '', $message);
        }

        return $message;
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('certification_background')
            ->useDisk('public')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/jpg'])
            ->singleFile();
    }
}
