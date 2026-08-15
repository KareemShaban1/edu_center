<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CertificationTemplate;
use App\Models\Parents;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentCertification;
use Illuminate\Support\Collection;

final class CertificationService
{
    public function __construct(
        private readonly WhatsAppLinkService $variableExtractor,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function listTemplates(): array
    {
        return CertificationTemplate::query()
            ->orderByDesc('is_system')
            ->orderBy('title')
            ->get()
            ->map(fn (CertificationTemplate $template) => $this->serializeTemplate($template))
            ->values()
            ->all();
    }

    /**
     * @param  array{
     *   title: string,
     *   content: string,
     *   variables?: list<string>|null,
     *   design_id?: string|null,
     *   design?: array<string, mixed>|null
     * }  $payload
     */
    public function createTemplate(array $payload): CertificationTemplate
    {
        $variables = $payload['variables'] ?? $this->variableExtractor->extractVariables($payload['content']);

        return CertificationTemplate::query()->create([
            'title' => $payload['title'],
            'content' => $payload['content'],
            'variables' => $variables,
            'design_id' => $payload['design_id'] ?? null,
            'design' => $payload['design'] ?? null,
            'is_system' => false,
        ]);
    }

    /**
     * @param  array{
     *   title: string,
     *   content: string,
     *   variables?: list<string>|null,
     *   design_id?: string|null,
     *   design?: array<string, mixed>|null
     * }  $payload
     */
    public function updateTemplate(CertificationTemplate $template, array $payload): CertificationTemplate
    {
        $variables = $payload['variables'] ?? $this->variableExtractor->extractVariables($payload['content']);

        $template->update([
            'title' => $payload['title'],
            'content' => $payload['content'],
            'variables' => $variables,
            'design_id' => $payload['design_id'] ?? $template->design_id,
            'design' => $payload['design'] ?? $template->design,
        ]);

        return $template->fresh();
    }

    public function deleteTemplate(CertificationTemplate $template): void
    {
        $template->delete();
    }

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

        return $query->limit(500)->get()->map(
            fn (StudentCertification $cert) => $this->serializeCertification($cert)
        )->values()->all();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   template: array<string, mixed>|null,
     *   certifications: list<array<string, mixed>>,
     *   counts: array{ready: int, total: int}
     * }
     */
    public function buildPreviews(array $payload): array
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
     * @param  list<array<string, mixed>>  $previews
     * @return list<array<string, mixed>>
     */
    public function issueCertifications(array $previews, int $issuedBy): array
    {
        $saved = [];

        foreach ($previews as $preview) {
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

        return $saved;
    }

    public function deleteIssued(StudentCertification $cert): void
    {
        $cert->delete();
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

    /**
     * @return array<string, mixed>
     */
    public function serializeTemplate(CertificationTemplate $template): array
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
    public function serializeCertification(StudentCertification $cert): array
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
