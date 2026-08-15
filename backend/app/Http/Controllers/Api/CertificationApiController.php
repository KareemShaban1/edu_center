<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IssueCertificationRequest;
use App\Http\Requests\Admin\StoreCertificationTemplateRequest;
use App\Http\Requests\Admin\UpdateCertificationTemplateRequest;
use App\Http\Support\ResolvesCenterApiContext;
use App\Services\CertificationIssueService;
use App\Services\CertificationTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class CertificationApiController extends Controller
{
    use ResolvesCenterApiContext;

    private const TENANT_GUARDS = ['web'];

    private const ROLE_MAP = [
        'web' => 'admin',
    ];

    public function __construct(
        private readonly CertificationTemplateService $templateService,
        private readonly CertificationIssueService $issueService,
    ) {}

    public function listTemplates(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        return response()->json(['templates' => $this->templateService->list()]);
    }

    public function createTemplate(StoreCertificationTemplateRequest $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $result = $this->templateService->create($request->validated());

        return response()->json($result, 201);
    }

    public function updateTemplate(UpdateCertificationTemplateRequest $request, int $id): JsonResponse
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

    public function listIssued(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $sectionId = $request->query('section_id');
        $studentId = $request->query('student_id');

        return response()->json([
            'certifications' => $this->issueService->listIssued(
                $sectionId ? (int) $sectionId : null,
                $studentId ? (int) $studentId : null,
            ),
        ]);
    }

    public function prepareIssue(IssueCertificationRequest $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        return response()->json($this->issueService->prepare($request->validated()));
    }

    public function issue(IssueCertificationRequest $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $issuedBy = (int) Auth::guard('web')->id();

        return response()->json($this->issueService->issue($request->validated(), $issuedBy));
    }

    public function deleteIssued(Request $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $this->issueService->deleteIssued($id);

        return response()->json(['message' => 'Certification deleted']);
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
