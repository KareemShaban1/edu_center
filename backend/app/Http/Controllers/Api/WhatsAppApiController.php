<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PrepareWhatsappSendRequest;
use App\Http\Requests\Admin\StoreWhatsappTemplateRequest;
use App\Http\Requests\Admin\UpdateWhatsappTemplateRequest;
use App\Http\Support\ResolvesCenterApiContext;
use App\Services\WhatsAppEvolutionService;
use App\Services\WhatsAppSendService;
use App\Services\WhatsAppTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class WhatsAppApiController extends Controller
{
    use ResolvesCenterApiContext;

    private const TENANT_GUARDS = ['web'];

    private const ROLE_MAP = [
        'web' => 'admin',
    ];

    public function __construct(
        private readonly WhatsAppTemplateService $templateService,
        private readonly WhatsAppSendService $sendService,
        private readonly WhatsAppEvolutionService $evolution,
    ) {}

    public function status(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $evolutionStatus = $this->evolution->status();

        return response()->json([
            'mode' => $this->evolution->mode(),
            'automatic_available' => $this->evolution->isConfigured() && $evolutionStatus['connected'],
            'evolution' => $evolutionStatus,
        ]);
    }

    public function listTemplates(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        return response()->json(['templates' => $this->templateService->list()]);
    }

    public function createTemplate(StoreWhatsappTemplateRequest $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $result = $this->templateService->create($request->validated());

        return response()->json($result, 201);
    }

    public function updateTemplate(UpdateWhatsappTemplateRequest $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        return response()->json($this->templateService->update($id, $request->validated()));
    }

    public function deleteTemplate(Request $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $this->templateService->delete($id);

        return response()->json(['message' => 'Template deleted']);
    }

    public function prepareSend(PrepareWhatsappSendRequest $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        return response()->json($this->sendService->prepare($request->validated()));
    }

    public function send(PrepareWhatsappSendRequest $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        return response()->json($this->sendService->send($request->validated()));
    }

    private function adminContextError(Request $request): ?JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web' || ! Auth::guard('web')->check()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        return null;
    }
}
