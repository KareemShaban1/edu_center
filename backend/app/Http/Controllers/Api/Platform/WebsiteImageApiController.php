<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class WebsiteImageApiController extends Controller
{
    private const SETTING_KEY = 'website_image_overrides';

    public function index(): JsonResponse
    {
        return response()->json(['images' => (object) $this->overrides()]);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $this->authorizeDeveloper();

        $payload = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif,svg,avif', 'max:15360'],
        ]);

        $file = $payload['image'];
        $overrides = $this->overrides();
        $previous = $overrides[$key]['path'] ?? null;
        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        $safeKey = preg_replace('/[^A-Za-z0-9_.-]/', '-', $key) ?: 'image';
        $path = $file->storeAs(
            'website-images',
            $safeKey.'-'.now()->format('YmdHis').'.'.$extension,
            'public',
        );

        if (is_string($previous) && $previous !== $path) {
            Storage::disk('public')->delete($previous);
        }

        $dimensions = @getimagesize($file->getRealPath()) ?: null;
        $item = [
            'key' => $key,
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
            'name' => $file->getClientOriginalName(),
            'mime' => $file->getMimeType(),
            'bytes' => $file->getSize(),
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'updated_at' => now()->toIso8601String(),
        ];

        $overrides[$key] = $item;
        $this->saveOverrides($overrides);

        return response()->json($item);
    }

    public function destroy(string $key): JsonResponse
    {
        $this->authorizeDeveloper();

        $overrides = $this->overrides();
        $path = $overrides[$key]['path'] ?? null;
        if (is_string($path)) {
            Storage::disk('public')->delete($path);
        }
        unset($overrides[$key]);
        $this->saveOverrides($overrides);

        return response()->json(['ok' => true]);
    }

    private function authorizeDeveloper(): void
    {
        $guard = request()->session()->get('api_auth_guard', 'platform_admin');
        abort_unless($guard === 'platform_admin' && Auth::guard('platform_admin')->check(), 403, 'Forbidden');
    }

    /** @return array<string, array<string, mixed>> */
    private function overrides(): array
    {
        $value = PlatformSetting::query()->where('key', self::SETTING_KEY)->value('value');
        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, array<string, mixed>> $overrides */
    private function saveOverrides(array $overrides): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => json_encode($overrides, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)],
        );
    }
}
