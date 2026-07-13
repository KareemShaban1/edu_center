<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;

class UiTranslationOverride extends Model
{
    protected $fillable = [
        'translation_key',
        'en_value',
        'ar_value',
        'is_deleted',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
    ];
}
