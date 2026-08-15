<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Resources\CertificationTemplateResource;
use App\Http\Resources\StudentCertificationResource;
use App\Models\CertificationTemplate;
use App\Models\Parents;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentCertification;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;

final class CertificationIssueService
{
    public function __construct(
        private readonly WhatsAppLinkService $variableExtractor,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function listIssued(?int $sectionId, ?int $studentId): array
    {
        $query = StudentCertification::query()
            ->with(['student:id,name', 'template:id,title'])
            ->orderByDesc('issued_at');

        if ($sectionId) {
            $query->where('section_id', $sectionId);
        }
        if ($studentId) {
            $query->where('student_id', $studentId);
        }

        return $query->limit(500)->get()
            ->map(fn (StudentCertification $cert) => StudentCertificationResource::make($cert)->resolve())
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   template: array<string, mixed>|null,
     *   certifications: list<array<string, mixed>>,
     *   counts: array{ready: int, total: int}
     * }
     */
    public function prepare(array $payload): array
    {
        return $this->buildPreviews($payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   message: string,
     *   certifications: list<array<string, mixed>>,
     *   counts: array{issued: int}
     * }
     */
    public function issue(array $payload, int $issuedBy): array
    {
        $built = $this->buildPreviews($payload);

        if ($built['counts']['ready'] === 0) {
            throw new HttpResponseException(response()->json([
                'message' => 'No students selected.',
                'certifications' => [],
                'counts' => ['issued' => 0],
            ], 422));
        }

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

            $saved[] = StudentCertificationResource::make(
                $cert->load(['student:id,name', 'template:id,title'])
            )->resolve();
        }

        return [
            'message' => 'Certifications issued',
            'certifications' => $saved,
            'counts' => ['issued' => count($saved)],
        ];
    }

    public function deleteIssued(int $id): void
    {
        $cert = StudentCertification::query()->find($id);
        if (! $cert) {
            throw new HttpResponseException(
                response()->json(['message' => 'Certification not found'], 404)
            );
        }

        $cert->delete();
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
            $template = CertificationTemplateResource::make($templateModel)->resolve();
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
     * @return Collection<int, Student>
     */
    private function resolveStudents(?int $sectionId, Collection $studentIds): Collection
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
}
