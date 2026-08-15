<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Resources\WhatsappTemplateResource;
use App\Models\Parents;
use App\Models\Student;
use App\Models\WhatsappTemplate;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class WhatsAppSendService
{
    public function __construct(
        private readonly NotificationDispatchService $dispatcher,
        private readonly WhatsAppLinkService $whatsAppLinks,
        private readonly WhatsAppEvolutionService $evolution,
        private readonly StudentWhatsAppContactResolver $contactResolver,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   template: array<string, mixed>,
     *   messages: list<array<string, mixed>>,
     *   counts: array{ready: int, skipped: int, total: int}
     * }
     */
    public function prepare(array $payload): array
    {
        $built = $this->buildMessages($payload);

        return [
            'template' => WhatsappTemplateResource::make($built['template'])->resolve(),
            'messages' => $built['messages'],
            'counts' => $built['counts'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   message: string,
     *   results: list<array<string, mixed>>,
     *   counts: array{sent: int, failed: int, skipped: int}
     * }
     */
    public function send(array $payload): array
    {
        if (! $this->evolution->isConfigured()) {
            throw new HttpResponseException(response()->json([
                'message' => 'Automatic WhatsApp sending is not configured. Set WHATSAPP_MODE=evolution in backend .env.',
            ], 422));
        }

        $evolutionStatus = $this->evolution->status();
        if (! $evolutionStatus['connected']) {
            throw new HttpResponseException(response()->json([
                'message' => $evolutionStatus['error'] ?? 'WhatsApp is not connected.',
            ], 422));
        }

        $built = $this->buildMessages($payload);

        if ($built['counts']['ready'] === 0) {
            throw new HttpResponseException(response()->json([
                'message' => 'No recipients with valid phone numbers.',
                'results' => [],
                'counts' => ['sent' => 0, 'failed' => 0, 'skipped' => $built['counts']['skipped']],
            ], 422));
        }

        $results = [];
        $sent = 0;
        $failed = 0;
        $delay = $this->evolution->sendDelayMicroseconds();

        foreach ($built['messages'] as $index => $message) {
            if ($index > 0 && $delay > 0) {
                usleep($delay);
            }

            $delivery = $this->evolution->sendText($message['phone'], $message['message']);
            $status = $delivery['success'] ? 'sent' : 'failed';

            if ($delivery['success']) {
                $sent++;
            } else {
                $failed++;
            }

            $results[] = [
                'recipient_type' => $message['recipient_type'],
                'recipient_id' => $message['recipient_id'],
                'student_id' => $message['student_id'] ?? null,
                'student_name' => $message['student_name'] ?? null,
                'name' => $message['name'],
                'phone' => $message['phone'],
                'message' => $message['message'],
                'status' => $status,
                'error' => $delivery['error'],
            ];
        }

        return [
            'message' => 'WhatsApp messages processed',
            'results' => $results,
            'counts' => [
                'sent' => $sent,
                'failed' => $failed,
                'skipped' => $built['counts']['skipped'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *   template: WhatsappTemplate,
     *   messages: list<array<string, mixed>>,
     *   counts: array{ready: int, skipped: int, total: int}
     * }
     */
    private function buildMessages(array $payload): array
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
     * @param  array<string, mixed>  $payload
     * @return Collection<int, array{type: string, model: Student|Parents, student_id?: int|null, phone?: string|null}>
     */
    private function resolveWhatsAppRecipients(array $payload): Collection
    {
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
            'audience' => $payload['audience'],
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
