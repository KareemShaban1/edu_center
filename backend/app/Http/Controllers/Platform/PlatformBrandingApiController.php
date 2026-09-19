<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class PlatformBrandingApiController extends Controller
{
    public const BRANDING_KEYS = [
        'brand_name_en',
        'brand_name_ar',
        'logo_url',
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
            'brand_name_en' => 'EduCenter',
            'brand_name_ar' => 'منصتي التعليمية',
            'logo_url' => '',
            'primary_color' => 'rgb(186, 24, 27)',
            'font_body' => "'Inter', sans-serif",
            'font_display' => "'Plus Jakarta Sans', sans-serif",
            'font_arabic' => "'Hajeen', 'Cairo', sans-serif",
            'text_scale' => '17',
            'text_scale_ar' => '18',
            'nav_font_scale' => '16',
            'nav_font_scale_ar' => '16',
            'button_font_scale' => '14',
            'button_font_scale_ar' => '14',
            'table_font_scale' => '16',
            'table_font_scale_ar' => '16',
            'landing_text_scale' => '18',
            'landing_text_scale_ar' => '18',
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
            'brand_name_en' => ['nullable', 'string', 'max:120'],
            'brand_name_ar' => ['nullable', 'string', 'max:120'],
            'logo_url' => ['nullable', 'string', 'max:2048'],
            'primary_color' => ['required', 'string', 'max:64'],
            'font_body' => ['required', 'string', 'max:255'],
            'font_display' => ['required', 'string', 'max:255'],
            'font_arabic' => ['required', 'string', 'max:255'],
            'text_scale' => ['required', 'numeric', 'min:10', 'max:40'],
            'text_scale_ar' => ['required', 'numeric', 'min:10', 'max:40'],
            'nav_font_scale' => ['required', 'numeric', 'min:10', 'max:40'],
            'nav_font_scale_ar' => ['required', 'numeric', 'min:10', 'max:40'],
            'button_font_scale' => ['required', 'numeric', 'min:10', 'max:40'],
            'button_font_scale_ar' => ['required', 'numeric', 'min:10', 'max:40'],
            'table_font_scale' => ['required', 'numeric', 'min:10', 'max:40'],
            'table_font_scale_ar' => ['required', 'numeric', 'min:10', 'max:40'],
            'landing_text_scale' => ['required', 'numeric', 'min:10', 'max:40'],
            'landing_text_scale_ar' => ['required', 'numeric', 'min:10', 'max:40'],
        ]);

        foreach ($payload as $key => $value) {
            PlatformSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => trim((string) ($value ?? ''))],
            );
        }

        return response()->json($this->resolveBranding());
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        if (! Schema::hasTable('platform_settings')) {
            return response()->json(['message' => 'Platform settings table is not installed. Run migrations.'], 503);
        }

        $request->validate([
            'logo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif,svg,avif', 'max:5120'],
        ]);

        /** @var UploadedFile $file */
        $file = $request->file('logo');
        $previousUrl = PlatformSetting::query()->where('key', 'logo_url')->value('value');
        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        $path = $file->storeAs(
            'website-images',
            'platform-brand-logo-'.now()->format('YmdHis').'.'.$extension,
            'public',
        );

        if (is_string($previousUrl) && $previousUrl !== '') {
            $previousPath = ltrim(preg_replace('#^/storage/#', '', parse_url($previousUrl, PHP_URL_PATH) ?: $previousUrl), '/');
            if ($previousPath !== '' && str_starts_with($previousPath, 'website-images/platform-brand-logo-')) {
                Storage::disk('public')->delete($previousPath);
            }
        }

        $url = '/storage/'.$path;
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'logo_url'],
            ['value' => $url],
        );

        return response()->json($this->resolveBranding());
    }

    public function clearLogo(Request $request): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }

        if (! Schema::hasTable('platform_settings')) {
            return response()->json(['message' => 'Platform settings table is not installed. Run migrations.'], 503);
        }

        $previousUrl = PlatformSetting::query()->where('key', 'logo_url')->value('value');
        if (is_string($previousUrl) && $previousUrl !== '') {
            $previousPath = ltrim(preg_replace('#^/storage/#', '', parse_url($previousUrl, PHP_URL_PATH) ?: $previousUrl), '/');
            if ($previousPath !== '' && str_starts_with($previousPath, 'website-images/platform-brand-logo-')) {
                Storage::disk('public')->delete($previousPath);
            }
        }

        PlatformSetting::query()->updateOrCreate(
            ['key' => 'logo_url'],
            ['value' => ''],
        );

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
            if (is_string($value)) {
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
