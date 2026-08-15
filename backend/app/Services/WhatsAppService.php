<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Parents;
use App\Models\Student;
use App\Models\WhatsappTemplate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class WhatsAppService
{
    public function __construct(
        private readonly NotificationDispatchService $dispatcher,
        private readonly WhatsAppLinkService $whatsAppLinks,
        private readonly StudentWhatsAppContactResolver $contactResolver,
    ) {}

    /**
     * @return list<array{id: int, name: string, content: string, variables: list<string>, created_at: string|null, updated_at: string|null}>
     */
    public function listTemplates(): array
    {
        return WhatsappTemplate::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (WhatsappTemplate $template) => $this->serializeTemplate($template))
            ->values()
            ->all();
    }

    /**
     * @param  array{name: string, content: string, variables?: list<string>|null}  $payload
     */
    public function createTemplate(array $payload): WhatsappTemplate
    {
        $variables = $payload['variables'] ?? $this->whatsAppLinks->extractVariables($payload['content']);

        return WhatsappTemplate::query()->create([
            'name' => $payload['name'],
            'content' => $payload['content'],
            'variables' => $variables,
        ]);
    }

    /**
     * @param  array{name: string, content: string, variables?: list<string>|null}  $payload
     */
    public function updateTemplate(WhatsappTemplate $template, array $payload): WhatsappTemplate
    {
        $variables = $payload['variables'] ?? $this->whatsAppLinks->extractVariables($payload['content']);

        $template->update([
            'name' => $payload['name'],
            'content' => $payload['content'],
            'variables' => $variables,
        ]);

        return $template->fresh();
    }

    public function deleteTemplate(WhatsappTemplate $template): void
    {
        $template->delete();
    }

    /**
     * @param  array{
     *   template_id: int,
     *   audience: string,
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   parent_ids?: int[],
     *   variables?: array<string, string>,
     *   student_variables?: array<int|string, array<string, string>>
     * }  $payload
     * @return array{
     *   template: WhatsappTemplate,
     *   messages: list<array{
     *     recipient_type: string,
     *     recipient_id: int,
     *     name: string,
     *     phone: string,
     *     message: string,
     *     whatsapp_url: string|null,
     *     student_id?: int|null,
     *     student_name?: string
     *   }>,
     *   counts: array{ready: int, skipped: int, total: int}
     * }
     */
    public function buildMessages(array $payload): array
    {
        $template = WhatsappTemplate::query()->findOrFail((int) $payload['template_id']);
        $overrides = $payload['variables'] ?? [];
        $sectionId = isset($payload['section_id']) ? (int) $payload['section_id'] : null;

        $recipients = $this->resolveWhatsAppRecipients($payload);

        $studentsHavePhone = Schema::connection('center')->hasColumn('students', 'phone');
        $studentVariables = $payload['student_variables'] ?? [];
        $messages = [];
        $skipped = 0;

        foreach ($recipients as $entry) {
            /** @var Student|Parents $model */
            $model = $entry['model'];
            $type = $entry['type'];
            $contextStudentId = isset($entry['student_id']) ? (int) $entry['student_id'] : null;
            $phone = $entry['phone'] ?? $this->resolvePhone($model, $type, $studentsHavePhone, $contextStudentId);

            if ($phone === null) {
                $skipped++;
                continue;
            }

            $perStudentOverrides = [];
            if ($contextStudentId !== null) {
                $raw = $studentVariables[$contextStudentId]
                    ?? $studentVariables[(string) $contextStudentId]
                    ?? null;
                $perStudentOverrides = is_array($raw) ? $raw : [];
            }

            $variables = array_merge(
                $this->buildDefaultVariables($model, $type, $sectionId, $contextStudentId),
                $overrides,
                $perStudentOverrides,
            );

            $message = $template->render($variables);
            $link = $this->whatsAppLinks->buildLink($phone, $message);

            if ($link === null) {
                $skipped++;
                continue;
            }

            $studentName = $variables['student_name'] ?? '';

            $messages[] = [
                'recipient_type' => $type,
                'recipient_id' => (int) $model->getKey(),
                'student_id' => $contextStudentId,
                'student_name' => $studentName,
                'name' => $this->resolveDisplayName($model, $type),
                'phone' => $phone,
                'message' => $message,
                'whatsapp_url' => $link,
            ];
        }

        return [
            'template' => $template,
            'messages' => $messages,
            'counts' => [
                'ready' => count($messages),
                'skipped' => $skipped,
                'total' => $recipients->count(),
            ],
        ];
    }

    /**
     * @return array{id: int, name: string, content: string, variables: list<string>, created_at: string|null, updated_at: string|null}
     */
    public function serializeTemplate(WhatsappTemplate $template): array
    {
        return [
            'id' => (int) $template->id,
            'name' => $template->name,
            'content' => $template->content,
            'variables' => array_values($template->variables ?? []),
            'created_at' => optional($template->created_at)?->toIso8601String(),
            'updated_at' => optional($template->updated_at)?->toIso8601String(),
        ];
    }

    /**
     * @param  array{
     *   audience: string,
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   parent_ids?: int[]
     * }  $payload
     * @return Collection<int, array{type: string, model: Student|Parents, student_id?: int|null, phone?: string|null}>
     */
    private function resolveWhatsAppRecipients(array $payload): Collection
    {
        $audience = $payload['audience'];
        $studentIds = collect($payload['student_ids'] ?? [])->filter()->map(fn ($id) => (int) $id)->unique()->values();

        if ($studentIds->isNotEmpty()) {
            $recipients = collect();

            Student::query()
                ->whereIn('id', $studentIds)
                ->get()
                ->each(function (Student $student) use ($recipients) {
                    $contact = $this->contactResolver->resolve($student);
                    if ($contact === null) {
                        return;
                    }

                    $recipients->push([
                        'type' => $contact['type'],
                        'model' => $contact['model'],
                        'student_id' => (int) $student->getKey(),
                        'phone' => $contact['phone'],
                    ]);
                });

            return $recipients->values();
        }

        return $this->dispatcher->resolveRecipients([
            'audience' => $audience,
            'section_id' => $payload['section_id'] ?? null,
            'student_ids' => $payload['student_ids'] ?? [],
            'parent_ids' => $payload['parent_ids'] ?? [],
        ])->map(fn (array $entry) => array_merge($entry, ['student_id' => null]));
    }

    private function resolvePhone(Student|Parents $model, string $type, bool $studentsHavePhone, ?int $contextStudentId = null): ?string
    {
        if ($type === 'parent') {
            /** @var Parents $model */
            return $model->parent_phone ?: null;
        }

        /** @var Student $model */
        if ($studentsHavePhone && ! empty($model->phone)) {
            return (string) $model->phone;
        }

        if (! empty($model->parent_id)) {
            $parent = Parents::query()->find($model->parent_id);

            return $parent?->parent_phone ?: null;
        }

        return null;
    }

    /**
     * @return array<string, string>
     */
    private function buildDefaultVariables(Student|Parents $model, string $type, ?int $sectionId, ?int $contextStudentId = null): array
    {
        if ($type === 'student') {
            /** @var Student $model */
            $parent = $model->parent_id ? Parents::query()->find($model->parent_id) : null;

            return [
                'name' => (string) ($model->name ?? ''),
                'student_name' => (string) ($model->name ?? ''),
                'parent_name' => (string) ($parent?->parent_name ?? ''),
            ];
        }

        /** @var Parents $model */
        $student = null;
        if ($contextStudentId) {
            $student = Student::query()->find($contextStudentId);
        } elseif ($sectionId) {
            $student = Student::query()
                ->where('parent_id', $model->getKey())
                ->where('section_id', $sectionId)
                ->orderBy('id')
                ->first();
        }

        if (! $student) {
            $student = Student::query()
                ->where('parent_id', $model->getKey())
                ->orderBy('id')
                ->first();
        }

        $studentName = (string) ($student?->name ?? '');

        return [
            'name' => (string) ($model->parent_name ?? ''),
            'parent_name' => (string) ($model->parent_name ?? ''),
            'student_name' => $studentName,
        ];
    }

    private function resolveDisplayName(Student|Parents $model, string $type): string
    {
        if ($type === 'student') {
            /** @var Student $model */
            return (string) ($model->name ?? '');
        }

        /** @var Parents $model */
        return (string) ($model->parent_name ?? '');
    }
}
