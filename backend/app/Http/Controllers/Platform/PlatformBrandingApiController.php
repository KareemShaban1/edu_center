<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class PlatformBrandingApiController extends Controller
{
    public const BRANDING_KEYS = [
        'primary_color',
        'font_body',
        'font_display',
        'font_arabic',
        'text_scale',
        'text_scale_ar',
        'nav_font_scale',
        'nav_font_scale_ar',
        'button_font_scale',
        'button_font_scale_ar',
        'table_font_scale',
        'table_font_scale_ar',
        'landing_text_scale',
        'landing_text_scale_ar',
    ];

    public static function defaults(): array
    {
        return [
            'primary_color' => 'rgb(186, 24, 27)',
            'font_body' => "'Inter', sans-serif",
            'font_display' => "'Plus Jakarta Sans', sans-serif",
            'font_arabic' => "'Hajeen', 'Cairo', sans-serif",
            'text_scale' => '106.25',
            'text_scale_ar' => '112.5',
            'nav_font_scale' => '100',
            'nav_font_scale_ar' => '100',
            'button_font_scale' => '100',
            'button_font_scale_ar' => '100',
            'table_font_scale' => '100',
            'table_font_scale_ar' => '100',
            'landing_text_scale' => '100',
            'landing_text_scale_ar' => '100',
        ];
    }

    public function show(): JsonResponse
    {
        return response()->json($this->resolveBranding());
    }

    public function update(Request $request): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        if (! Schema::hasTable('platform_settings')) {
            return response()->json(['message' => 'Platform settings table is not installed. Run migrations.'], 503);
        }

        $payload = $request->validate([
            'primary_color' => ['required', 'string', 'max:64'],
            'font_body' => ['required', 'string', 'max:255'],
            'font_display' => ['required', 'string', 'max:255'],
            'font_arabic' => ['required', 'string', 'max:255'],
            'text_scale' => ['required', 'numeric', 'min:80', 'max:150'],
            'text_scale_ar' => ['required', 'numeric', 'min:80', 'max:150'],
            'nav_font_scale' => ['required', 'numeric', 'min:80', 'max:150'],
            'nav_font_scale_ar' => ['required', 'numeric', 'min:80', 'max:150'],
            'button_font_scale' => ['required', 'numeric', 'min:80', 'max:150'],
            'button_font_scale_ar' => ['required', 'numeric', 'min:80', 'max:150'],
            'table_font_scale' => ['required', 'numeric', 'min:80', 'max:150'],
            'table_font_scale_ar' => ['required', 'numeric', 'min:80', 'max:150'],
            'landing_text_scale' => ['required', 'numeric', 'min:80', 'max:150'],
            'landing_text_scale_ar' => ['required', 'numeric', 'min:80', 'max:150'],
        ]);

        foreach ($payload as $key => $value) {
            PlatformSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => trim((string) $value)],
            );
        }

        return response()->json($this->resolveBranding());
    }

    protected function resolveBranding(): array
    {
        $branding = self::defaults();

        if (! Schema::hasTable('platform_settings')) {
            return $branding;
        }

        $stored = PlatformSetting::query()
            ->whereIn('key', self::BRANDING_KEYS)
            ->pluck('value', 'key');

        foreach (self::BRANDING_KEYS as $key) {
            $value = $stored->get($key);
            if (is_string($value) && $value !== '') {
                $branding[$key] = $value;
            }
        }

        return $branding;
    }

    protected function denyUnlessPlatform(Request $request): ?JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'platform_admin');
        if ($guard !== 'platform_admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $authUserId = Auth::guard('platform_admin')->id() ?? $request->session()->get('api_auth_user_id');
        if (! $authUserId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return null;
    }
}
