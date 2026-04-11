<?php

// app/Services/PushService.php
namespace App\Services;

use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushService
{
    public static function sendNotification($subscription, $payload)
    {
        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('services.webpush.vapid.subject'),
                'publicKey' => config('services.webpush.vapid.public_key'),
                'privateKey' => config('services.webpush.vapid.private_key'),
            ],
        ]);

        $sub = Subscription::create([
            'endpoint' => $subscription['endpoint'],
            'publicKey' => $subscription['keys']['p256dh'],
            'authToken' => $subscription['keys']['auth'],
        ]);

        return $webPush->sendOneNotification($sub, json_encode($payload));
    }
}