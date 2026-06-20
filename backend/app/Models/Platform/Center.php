<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;

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
        'city',
        'status',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
        'status' => 'integer',
    ];

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
