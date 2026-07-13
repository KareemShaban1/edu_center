<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\UiTranslationOverride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UiTranslationApiController extends Controller
{
    public function index(): JsonResponse
    {
        $items = UiTranslationOverride::query()
            ->orderBy('translation_key')
            ->get()
            ->map(fn (UiTranslationOverride $item) => [
                'key' => $item->translation_key,
                'en' => $item->en_value,
                'ar' => $item->ar_value,
                'is_deleted' => $item->is_deleted,
                'updated_at' => optional($item->updated_at)?->toIso8601String(),
            ])
            ->values();

        return response()->json(['translations' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeDeveloper();

        $payload = $this->validateTranslation($request);
        $item = UiTranslationOverride::query()->updateOrCreate(
            ['translation_key' => $payload['key']],
            [
                'en_value' => $payload['en'],
                'ar_value' => $payload['ar'],
                'is_deleted' => false,
            ],
        );

        return response()->json($this->serialize($item), 201);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $this->authorizeDeveloper();

        $payload = $this->validateTranslation($request, $key);

        $item = DB::transaction(function () use ($key, $payload) {
            if ($payload['key'] !== $key) {
                UiTranslationOverride::query()->updateOrCreate(
                    ['translation_key' => $key],
                    ['en_value' => null, 'ar_value' => null, 'is_deleted' => true],
                );
            }

            return UiTranslationOverride::query()->updateOrCreate(
                ['translation_key' => $payload['key']],
                [
                    'en_value' => $payload['en'],
                    'ar_value' => $payload['ar'],
                    'is_deleted' => false,
                ],
            );
        });

        return response()->json($this->serialize($item));
    }

    public function destroy(string $key): JsonResponse
    {
        $this->authorizeDeveloper();

        UiTranslationOverride::query()->updateOrCreate(
            ['translation_key' => $key],
            ['en_value' => null, 'ar_value' => null, 'is_deleted' => true],
        );

        return response()->json(['ok' => true]);
    }

    private function authorizeDeveloper(): void
    {
        $guard = request()->session()->get('api_auth_guard', 'platform_admin');
        abort_unless($guard === 'platform_admin' && Auth::guard('platform_admin')->check(), 403, 'Forbidden');
    }

    /** @return array{key: string, en: string, ar: string} */
    private function validateTranslation(Request $request, ?string $currentKey = null): array
    {
        return $request->validate([
            'key' => [
                'required',
                'string',
                'max:190',
                'regex:/^[A-Za-z0-9_.-]+$/',
                Rule::unique('ui_translation_overrides', 'translation_key')
                    ->ignore($currentKey, 'translation_key')
                    ->where(fn ($query) => $query->where('is_deleted', false)),
            ],
            'en' => ['required', 'string', 'max:10000'],
            'ar' => ['required', 'string', 'max:10000'],
        ]);
    }

    /** @return array<string, mixed> */
    private function serialize(UiTranslationOverride $item): array
    {
        return [
            'key' => $item->translation_key,
            'en' => $item->en_value,
            'ar' => $item->ar_value,
            'is_deleted' => $item->is_deleted,
            'updated_at' => optional($item->updated_at)?->toIso8601String(),
        ];
    }
}
