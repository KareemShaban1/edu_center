<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;






Broadcast::channel('parent.{id}', function ($user, $id) {
    \Log::info('Broadcast channel auth check', [
        'user_type' => get_class($user),
        'user_id' => $user->id,
        'expected_id' => $id,
    ]);
    if ($user instanceof \App\Models\Parents && $user->id == $id) {
        return ['id' => $user->id]; // ✅ required!
    }
    return false;
});
