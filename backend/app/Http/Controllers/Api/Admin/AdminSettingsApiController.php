<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminSettingsRequest;
use App\Http\Support\ResolvesAdminApiContext;
use App\Services\AutoGenerateSessionsService;
use App\Services\CenterSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminSettingsApiController extends Controller
{
    use ResolvesAdminApiContext;

    public function __construct(
        private readonly CenterSettingsService $settingsService,
        private readonly AutoGenerateSessionsService $autoGenerateSessionsService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        return response()->json([
            'settings' => $this->settingsService->toApiSettings(),
        ]);
    }

    public function update(UpdateAdminSettingsRequest $request): JsonResponse
    {
        ['error' => $error] = $this->resolveAdminWebContext($request);
        if ($error) {
            return $error;
        }

        $payload = $request->validated();
        $this->settingsService->applyFromApiPayload($payload);

        $generation = null;
        $shouldGenerate = ! empty($payload['generate_now'])
            || (! empty($payload['auto_generate_sessions']));

        if ($shouldGenerate && $this->settingsService->getBool(CenterSettingsService::KEY_AUTO_GENERATE_SESSIONS)) {
            $generation = $this->autoGenerateSessionsService->generateForCurrentCenter(
                respectSetting: true
            );
        }

        return response()->json([
            'message' => 'Settings saved.',
            'settings' => $this->settingsService->toApiSettings(),
            'generation' => $generation,
        ]);
    }
}
