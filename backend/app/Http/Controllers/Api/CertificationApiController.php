<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesCenterApiContext;
use App\Models\CertificationTemplate;
use App\Models\Parents;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentCertification;
use App\Services\NotificationDispatchService;
use App\Services\WhatsAppLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class CertificationApiController extends Controller
{
    use ResolvesCenterApiContext;

    private const TENANT_GUARDS = ['web'];

    private const ROLE_MAP = [
        'web' => 'admin',
    ];

    public function __construct(
        private readonly NotificationDispatchService $dispatcher,
        private readonly WhatsAppLinkService $variableExtractor,
    ) {}

    public function listTemplates(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $templates = CertificationTemplate::query()
            ->orderByDesc('is_system')
            ->orderBy('title')
            ->get()
            ->map(fn (CertificationTemplate $template) => $this->serializeTemplate($template))
            ->values();

        return response()->json(['templates' => $templates]);
    }

    public function createTemplate(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:8000'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string', 'max:64'],
            'design_id' => ['nullable', 'string', 'max:64'],
            'design' => ['nullable', 'array'],
        ]);

        $variables = $payload['variables'] ?? $this->variableExtractor->extractVariables($payload['content']);

        $template = CertificationTemplate::query()->create([
            'title' => $payload['title'],
            'content' => $payload['content'],
            'variables' => $variables,
            'design_id' => $payload['design_id'] ?? null,
            'design' => $payload['design'] ?? null,
            'is_system' => false,
        ]);

        return response()->json(['template' => $this->serializeTemplate($template)], 201);
    }

    public function updateTemplate(Request $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $template = CertificationTemplate::query()->find($id);
        if (! $template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:8000'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string', 'max:64'],
            'design_id' => ['nullable', 'string', 'max:64'],
            'design' => ['nullable', 'array'],
        ]);

        $variables = $payload['variables'] ?? $this->variableExtractor->extractVariables($payload['content']);

        $template->update([
            'title' => $payload['title'],
            'content' => $payload['content'],
            'variables' => $variables,
            'design_id' => $payload['design_id'] ?? $template->design_id,
            'design' => $payload['design'] ?? $template->design,
        ]);

        return response()->json(['template' => $this->serializeTemplate($template->fresh())]);
    }

    public function deleteTemplate(Request $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $template = CertificationTemplate::query()->find($id);
        if (! $template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        $template->delete();

        return response()->json(['message' => 'Template deleted']);
    }

    public function listIssued(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $sectionId = $request->query('section_id');
        $studentId = $request->query('student_id');

        $query = StudentCertification::query()
            ->with(['student:id,name', 'template:id,title'])
            ->orderByDesc('issued_at');

        if ($sectionId) {
            $query->where('section_id', (int) $sectionId);
        }
        if ($studentId) {
            $query->where('student_id', (int) $studentId);
        }

        $certifications = $query->limit(500)->get()->map(
            fn (StudentCertification $cert) => $this->serializeCertification($cert)
        )->values();

        return response()->json(['certifications' => $certifications]);
    }

    public function prepareIssue(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $payload = $this->validateIssuePayload($request);
        $built = $this->buildPreviews($payload);

        return response()->json([
            'template' => $built['template'],
            'certifications' => $built['certifications'],
            'counts' => $built['counts'],
        ]);
    }

    public function issue(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $payload = $this->validateIssuePayload($request);
        $built = $this->buildPreviews($payload);

        if ($built['counts']['ready'] === 0) {
            return response()->json([
                'message' => 'No students selected.',
                'certifications' => [],
                'counts' => ['issued' => 0],
            ], 422);
        }

        $issuedBy = Auth::guard('web')->id();
        $saved = [];

        foreach ($built['certifications'] as $preview) {
            $cert = StudentCertification::query()->create([
                'template_id' => $preview['template_id'],
                'student_id' => $preview['student_id'],
                'section_id' => $preview['section_id'],
                'title' => $preview['title'],
                'content' => $preview['content'],
                'variables' => $preview['variables'],
                'design' => $preview['design'] ?? null,
                'context' => $preview['context'],
                'context_date' => $preview['context_date'],
                'issued_at' => now(),
                'issued_by' => $issuedBy,
                'is_custom' => $preview['is_custom'],
            ]);

            $saved[] = $this->serializeCertification($cert->load(['student:id,name', 'template:id,title']));
        }

        return response()->json([
            'message' => 'Certifications issued',
            'certifications' => $saved,
            'counts' => ['issued' => count($saved)],
        ]);
    }

    public function deleteIssued(Request $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $cert = StudentCertification::query()->find($id);
        if (! $cert) {
            return response()->json(['message' => 'Certification not found'], 404);
        }

        $cert->delete();

        return response()->json(['message' => 'Certification deleted']);
    }

    /**
     * @return array{
     *   template_id?: int|null,
     *   custom_title?: string|null,
     *   custom_content?: string|null,
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   variables?: array<string, string>,
     *   student_variables?: array<int|string, array<string, string>>,
     *   context?: string,
     *   context_date?: string|null
     * }
     */
    private function validateIssuePayload(Request $request): array
    {
        $payload = $request->validate([
            'template_id' => ['nullable', 'integer', 'exists:center.certification_templates,id'],
            'custom_title' => ['nullable', 'string', 'max:255', 'required_without:template_id'],
            'custom_content' => ['nullable', 'string', 'max:8000', 'required_without:template_id'],
            'section_id' => ['nullable', 'integer', 'exists:center.sections,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:center.students,id'],
            'variables' => ['nullable', 'array'],
            'student_variables' => ['nullable', 'array'],
            'context' => ['nullable', 'string', 'max:32'],
            'context_date' => ['nullable', 'date'],
        ]);

        if (empty($payload['template_id']) && (empty($payload['custom_title']) || empty($payload['custom_content']))) {
            abort(response()->json([
                'message' => 'Select a template or provide custom title and content.',
            ], 422));
        }

        if (empty($payload['section_id']) && empty($payload['student_ids'])) {
            abort(response()->json([
                'message' => 'Select a section or specific students.',
            ], 422));
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   template: array<string, mixed>|null,
     *   certifications: list<array<string, mixed>>,
     *   counts: array{ready: int, total: int}
     * }
     */
    private function buildPreviews(array $payload): array
    {
        $template = null;
        $isCustom = false;
        $title = '';
        $contentTemplate = '';
        $variables = [];
        $design = null;
        $designId = null;

        if (! empty($payload['template_id'])) {
            $templateModel = CertificationTemplate::query()->findOrFail((int) $payload['template_id']);
            $template = $this->serializeTemplate($templateModel);
            $title = $templateModel->title;
            $contentTemplate = $templateModel->content;
            $variables = $templateModel->variables ?? [];
            $design = $templateModel->design;
            $designId = $templateModel->design_id;
        } else {
            $isCustom = true;
            $title = (string) $payload['custom_title'];
            $contentTemplate = (string) $payload['custom_content'];
            $variables = $this->variableExtractor->extractVariables($contentTemplate);
            $template = [
                'id' => null,
                'title' => $title,
                'content' => $contentTemplate,
                'variables' => $variables,
                'is_system' => false,
            ];
        }

        $sectionId = isset($payload['section_id']) ? (int) $payload['section_id'] : null;
        $studentIds = collect($payload['student_ids'] ?? [])->filter()->map(fn ($id) => (int) $id)->unique()->values();
        $overrides = $payload['variables'] ?? [];
        $studentVariables = $payload['student_variables'] ?? [];
        $context = $payload['context'] ?? 'manual';
        $contextDate = $payload['context_date'] ?? null;

        $students = $this->resolveStudents($sectionId, $studentIds);
        $sectionName = $sectionId ? (Section::query()->find($sectionId)?->section_name ?? '') : '';

        $certifications = [];

        foreach ($students as $student) {
            $studentId = (int) $student->getKey();
            $raw = $studentVariables[$studentId] ?? $studentVariables[(string) $studentId] ?? null;
            $perStudentOverrides = is_array($raw) ? $raw : [];

            $varData = array_merge(
                $this->buildDefaultVariables($student, $sectionName, $contextDate),
                $overrides,
                $perStudentOverrides,
            );

            $renderedContent = $this->renderContent($contentTemplate, $variables, $varData);
            $renderedTitle = $this->renderContent($title, $variables, $varData);
            $renderedDesign = $this->renderDesignSnapshot($design, $varData);

            $certifications[] = [
                'template_id' => $template['id'] ?? null,
                'student_id' => $studentId,
                'student_name' => (string) ($student->name ?? ''),
                'section_id' => $sectionId,
                'title' => $renderedTitle,
                'content' => $renderedContent,
                'variables' => $varData,
                'design' => $renderedDesign,
                'design_id' => $designId,
                'context' => $context,
                'context_date' => $contextDate,
                'is_custom' => $isCustom,
            ];
        }

        return [
            'template' => $template,
            'certifications' => $certifications,
            'counts' => [
                'ready' => count($certifications),
                'total' => $students->count(),
            ],
        ];
    }

    /**
     * @param  list<string>  $variables
     */
    private function renderContent(string $template, array $variables, array $data): string
    {
        $message = $template;
        foreach ($variables as $key) {
            $message = str_replace('{{'.$key.'}}', $data[$key] ?? '', $message);
        }

        return $message;
    }

    /**
     * @return \Illuminate\Support\Collection<int, Student>
     */
    private function resolveStudents(?int $sectionId, \Illuminate\Support\Collection $studentIds): \Illuminate\Support\Collection
    {
        if ($studentIds->isNotEmpty()) {
            return Student::query()->whereIn('id', $studentIds)->get();
        }

        if ($sectionId) {
            return Student::query()->where('section_id', $sectionId)->orderBy('name')->get();
        }

        return collect();
    }

    /**
     * @return array<string, string>
     */
    private function buildDefaultVariables(Student $student, string $sectionName, ?string $contextDate): array
    {
        $parent = $student->parent_id ? Parents::query()->find($student->parent_id) : null;

        return [
            'student_name' => (string) ($student->name ?? ''),
            'name' => (string) ($student->name ?? ''),
            'parent_name' => (string) ($parent?->parent_name ?? ''),
            'section_name' => $sectionName,
            'date' => $contextDate ?? now()->toDateString(),
            'issue_date' => $contextDate ?? now()->toDateString(),
            'center_name' => (string) (config('app.name') ?? 'Education Center'),
        ];
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

    /**
     * @param  array<string, mixed>|null  $design
     * @return array<string, mixed>|null
     */
    private function renderDesignSnapshot(?array $design, array $varData): ?array
    {
        if (! is_array($design) || empty($design['fields']) || ! is_array($design['fields'])) {
            return $design;
        }

        $fields = $design['fields'];
        $renderedFields = [];
        foreach (['heading', 'subtitle', 'body', 'footer'] as $key) {
            $text = (string) ($fields[$key] ?? '');
            foreach ($varData as $varKey => $varValue) {
                $text = str_replace('{{'.$varKey.'}}', (string) $varValue, $text);
            }
            $renderedFields[$key] = $text;
        }

        return array_merge($design, ['fields' => $renderedFields]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeTemplate(CertificationTemplate $template): array
    {
        return [
            'id' => (int) $template->id,
            'title' => $template->title,
            'content' => $template->content,
            'variables' => array_values($template->variables ?? []),
            'design_id' => $template->design_id,
            'design' => $template->design,
            'is_system' => (bool) $template->is_system,
            'background_url' => $template->getFirstMediaUrl('certification_background') ?: null,
            'created_at' => optional($template->created_at)?->toIso8601String(),
            'updated_at' => optional($template->updated_at)?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeCertification(StudentCertification $cert): array
    {
        return [
            'id' => (int) $cert->id,
            'template_id' => $cert->template_id ? (int) $cert->template_id : null,
            'template_title' => $cert->template?->title,
            'student_id' => (int) $cert->student_id,
            'student_name' => $cert->student?->name,
            'section_id' => $cert->section_id ? (int) $cert->section_id : null,
            'title' => $cert->title,
            'content' => $cert->content,
            'variables' => $cert->variables ?? [],
            'design' => $cert->design,
            'design_id' => $cert->template?->design_id,
            'context' => $cert->context,
            'context_date' => optional($cert->context_date)?->toDateString(),
            'issued_at' => optional($cert->issued_at)?->toIso8601String(),
            'is_custom' => (bool) $cert->is_custom,
        ];
    }
}
