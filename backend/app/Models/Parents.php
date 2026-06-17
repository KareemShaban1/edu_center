<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenterViaMembership;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Spatie\Translatable\HasTranslations;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Parents extends Authenticatable
{
    use BelongsToCenterViaMembership;
    // use HasTranslations;
    use Notifiable;

    // public $translatable = ['parent_name', 'parent_job', 'mother_name', 'mother_job'];

    protected $fillable = [
        'parent_name',
        'parent_job',
        'parent_phone',
        'parent_address',
        'notes',
        'push_subscription',
        'email',
        'password',
        'is_active'
    ];

    protected $table = 'parents';
    protected $guarded = [];

    protected $connection = 'center';

    public function receivesBroadcastNotificationsOn()
    {
        return 'parent.' . $this->id;
    }
}
