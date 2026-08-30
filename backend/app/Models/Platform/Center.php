<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Center extends Model
{
    protected $table = 'centers';

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'email',
        'phone',
        'address',
        'governorate_id',
        'city_id',
        'area_id',
        'lat',
        'long',
        'status',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
        'status' => 'integer',
        'governorate_id' => 'integer',
        'city_id' => 'integer',
        'area_id' => 'integer',
        'lat' => 'float',
        'long' => 'float',
    ];

    /** @return BelongsTo<Governorate, $this> */
    public function governorate(): BelongsTo
    {
        return $this->belongsTo(Governorate::class);
    }

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /** @return BelongsTo<Area, $this> */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function isActive(): bool
    {
        return (int) $this->status === 1;
    }

    public function plan(): string
    {
        return (string) data_get($this->data, 'plan', data_get($this->data, 'subscription.plan', 'Starter'));
    }
}
