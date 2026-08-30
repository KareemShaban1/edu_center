<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Area extends Model
{
    protected $fillable = [
        'city_id',
        'name',
        'lat',
        'long',
        'status',
    ];

    protected $casts = [
        'city_id' => 'integer',
        'lat' => 'float',
        'long' => 'float',
        'status' => 'integer',
    ];

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
