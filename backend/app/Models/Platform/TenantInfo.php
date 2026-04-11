<?php

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantInfo extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'subdomain',
        'status',
        'tenant_id',
    ];


    public function getStatusLabelAttribute()
    {
        return match ($this->status) {
            0 => 'Inactive',
            1 => 'Active',
            2 => 'Suspended',
            default => 'Unknown',
        };
    }

    public function isActive()
    {
        return $this->status === 1;
    }
    public function isSuspended()
    {
        return $this->status === 2;
    }
    public function isInactive()
    {
        return $this->status === 0;
    }
    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }
    public function scopeSuspended($query)
    {
        return $query->where('status', 2);
    }
    public function scopeInactive($query)
    {
        return $query->where('status', 0);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
