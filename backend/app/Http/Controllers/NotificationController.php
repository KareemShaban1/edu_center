<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class NotificationController extends Controller
{
    //
    public function sendFCM(Request $request)
    {
        // $SERVER_API_KEY = config('services.fcm.server_key'); // store in config/services.php or .env
        $SERVER_API_KEY = 'BGPw2F8l8ZydYflb_EG3QkzxUF7EHR2KmJ13WPB1L0AkgL1JsaR3BSgaLtmSG20xGaODjEInnM82mRFvgan0uMI';

        $data = [
            "to" => $request->fcm_token, // single device
            "notification" => [
                "title" => $request->title,
                "body"  => $request->body,
                "icon"  => "/images/icon.png"
            ]
        ];

        $response = Http::withHeaders([
            "Authorization" => "key=" . $SERVER_API_KEY,
            "Content-Type"  => "application/json",
        ])->post('https://fcm.googleapis.com/fcm/send', $data);

        return $response->json();
    }

    public function getVapidKey()
    {
        return response()->json([
            'publicKey' => config('services.webpush.vapid.public_key')
        ]);
    }

    // Updated subscribe method
    public function subscribe(Request $request)
    {
        try {
            $subscription = $request->subscription;

            if (empty($subscription)) {
                return response()->json(['error' => 'Empty subscription'], 400);
            }

            $user = auth()->user();
            $user->update([
                'push_subscription' => json_encode($subscription)
            ]);

            \Log::info("Push subscription updated for user {$user->id}", [
                'endpoint' => $subscription['endpoint'] ?? null,
                'keys' => $subscription['keys'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscription saved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Subscription error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
