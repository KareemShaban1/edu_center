<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Translatable\HasTranslations;

class Teacher extends  Authenticatable
{
    use BelongsToCenter;
    use Notifiable;
 
    protected $guarded = [];

    protected $connection = 'center';


    protected $fillable = [
        'name','email','password','subject','gender','phone','address','joining_date'
    ];

    ////////////   Relationships   ////////////
    
    public function sections()
    {
        return $this->belongsToMany('App\Models\Section', 'teacher_section');
    }

    public function receivesBroadcastNotificationsOn()
    {
        return 'teacher.' . $this->id;
    }
    ///////////////////////////////////////////
    
}
