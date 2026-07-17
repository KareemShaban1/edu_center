<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\AutoGenerateSessionsService;
use App\Services\CenterSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function show(Request $request): JsonResponse
    {
        $ctx = $this->resolveAdminWebContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }

        $settings = app(CenterSettingsService::class);
        $all = $settings->all();
        $automation = $settings->sessionAutomation();

        return response()->json([
            'settings' => [
                'center_name' => $all['center_name'] ?? '',
                'center_email' => $all['center_email'] ?? '',
                'phone' => $all['phone'] ?? '',
                'address' => $all['address'] ?? '',
                'current_session' => $all['current_session'] ?? '',
                'timezone' => $automation['timezone'],
                'auto_generate_sessions' => $automation['enabled'],
                'auto_session_days_ahead' => $automation['days_ahead'],
                'auto_session_duration' => $automation['duration'],
                'auto_session_type' => $automation['session_type'],
                'auto_session_provider' => $automation['provider'],
                'auto_session_location' => $automation['location'],
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $ctx = $this->resolveAdminWebContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }

        $payload = $request->validate([
            'center_name' => ['nullable', 'string', 'max:255'],
            'center_email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'current_session' => ['nullable', 'string', 'max:50'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'auto_generate_sessions' => ['nullable', 'boolean'],
            'auto_session_days_ahead' => ['nullable', 'integer', 'min:1', 'max:60'],
            'auto_session_duration' => ['nullable', 'integer', 'min:15', 'max:480'],
            'auto_session_type' => ['nullable', 'in:offline,online'],
            'auto_session_provider' => ['nullable', 'in:offline,jitsi,livekit'],
            'auto_session_location' => ['nullable', 'string', 'max:2000'],
            'generate_now' => ['nullable', 'boolean'],
        ]);

        $settings = app(CenterSettingsService::class);

        $pairs = [];
        foreach ([
            'center_name',
            'center_email',
            'phone',
            'address',
            'current_session',
            'timezone',
            'auto_session_location',
        ] as $key) {
            if (array_key_exists($key, $payload)) {
                $pairs[$key === 'timezone' ? CenterSettingsService::KEY_TIMEZONE : $key] = (string) ($payload[$key] ?? '');
            }
        }

        if (array_key_exists('auto_generate_sessions', $payload)) {
            $pairs[CenterSettingsService::KEY_AUTO_GENERATE_SESSIONS] = ! empty($payload['auto_generate_sessions']) ? '1' : '0';
        }
        if (array_key_exists('auto_session_days_ahead', $payload)) {
            $pairs[CenterSettingsService::KEY_AUTO_SESSION_DAYS_AHEAD] = (string) (int) $payload['auto_session_days_ahead'];
        }
        if (array_key_exists('auto_session_duration', $payload)) {
            $pairs[CenterSettingsService::KEY_AUTO_SESSION_DURATION] = (string) (int) $payload['auto_session_duration'];
        }
        if (array_key_exists('auto_session_type', $payload)) {
            $pairs[CenterSettingsService::KEY_AUTO_SESSION_TYPE] = (string) $payload['auto_session_type'];
        }
        if (array_key_exists('auto_session_provider', $payload)) {
            $pairs[CenterSettingsService::KEY_AUTO_SESSION_PROVIDER] = (string) $payload['auto_session_provider'];
        }

        $settings->putMany($pairs);

        $generation = null;
        $shouldGenerate = ! empty($payload['generate_now'])
            || (! empty($payload['auto_generate_sessions']));

        if ($shouldGenerate && $settings->getBool(CenterSettingsService::KEY_AUTO_GENERATE_SESSIONS)) {
            $generation = app(AutoGenerateSessionsService::class)->generateForCurrentCenter(
                respectSetting: true
            );
        }

        $all = $settings->all();
        $automation = $settings->sessionAutomation();

        return response()->json([
            'message' => 'Settings saved.',
            'settings' => [
                'center_name' => $all['center_name'] ?? '',
                'center_email' => $all['center_email'] ?? '',
                'phone' => $all['phone'] ?? '',
                'address' => $all['address'] ?? '',
                'current_session' => $all['current_session'] ?? '',
                'timezone' => $automation['timezone'],
                'auto_generate_sessions' => $automation['enabled'],
                'auto_session_days_ahead' => $automation['days_ahead'],
                'auto_session_duration' => $automation['duration'],
                'auto_session_type' => $automation['session_type'],
                'auto_session_provider' => $automation['provider'],
                'auto_session_location' => $automation['location'],
            ],
            'generation' => $generation,
        ]);
    }
}
