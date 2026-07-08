<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesCenterApiContext;
use App\Models\Parents;
use App\Models\Student;
use App\Models\WhatsappTemplate;
use App\Services\NotificationDispatchService;
use App\Services\WhatsAppEvolutionService;
use App\Services\WhatsAppLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class WhatsAppApiController extends Controller
{
    use ResolvesCenterApiContext;

    private const TENANT_GUARDS = ['web'];

    private const ROLE_MAP = [
        'web' => 'admin',
    ];

    public function __construct(
        private readonly NotificationDispatchService $dispatcher,
        private readonly WhatsAppLinkService $whatsAppLinks,
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

        $templates = WhatsappTemplate::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (WhatsappTemplate $template) => $this->serializeTemplate($template))
            ->values();

        return response()->json(['templates' => $templates]);
    }

    public function createTemplate(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:4000'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string', 'max:64'],
        ]);

        $variables = $payload['variables'] ?? $this->whatsAppLinks->extractVariables($payload['content']);

        $template = WhatsappTemplate::query()->create([
            'name' => $payload['name'],
            'content' => $payload['content'],
            'variables' => $variables,
        ]);

        return response()->json(['template' => $this->serializeTemplate($template)], 201);
    }

    public function updateTemplate(Request $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $template = WhatsappTemplate::query()->find($id);
        if (! $template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:4000'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string', 'max:64'],
        ]);

        $variables = $payload['variables'] ?? $this->whatsAppLinks->extractVariables($payload['content']);

        $template->update([
            'name' => $payload['name'],
            'content' => $payload['content'],
            'variables' => $variables,
        ]);

        return response()->json(['template' => $this->serializeTemplate($template->fresh())]);
    }

    public function deleteTemplate(Request $request, int $id): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $template = WhatsappTemplate::query()->find($id);
        if (! $template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        $template->delete();

        return response()->json(['message' => 'Template deleted']);
    }

    public function prepareSend(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        $payload = $this->validateSendPayload($request);
        $built = $this->buildMessages($payload);

        return response()->json([
            'template' => $this->serializeTemplate($built['template']),
            'messages' => $built['messages'],
            'counts' => $built['counts'],
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        if ($error = $this->adminContextError($request)) {
            return $error;
        }

        if (! $this->evolution->isConfigured()) {
            return response()->json([
                'message' => 'Automatic WhatsApp sending is not configured. Set WHATSAPP_MODE=evolution in backend .env.',
            ], 422);
        }

        $evolutionStatus = $this->evolution->status();
        if (! $evolutionStatus['connected']) {
            return response()->json([
                'message' => $evolutionStatus['error'] ?? 'WhatsApp is not connected.',
            ], 422);
        }

        $payload = $this->validateSendPayload($request);
        $built = $this->buildMessages($payload);

        if ($built['counts']['ready'] === 0) {
            return response()->json([
                'message' => 'No recipients with valid phone numbers.',
                'results' => [],
                'counts' => ['sent' => 0, 'failed' => 0, 'skipped' => $built['counts']['skipped']],
            ], 422);
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

        return response()->json([
            'message' => 'WhatsApp messages processed',
            'results' => $results,
            'counts' => [
                'sent' => $sent,
                'failed' => $failed,
                'skipped' => $built['counts']['skipped'],
            ],
        ]);
    }

    /**
     * @return array{
     *   template_id: int,
     *   audience: string,
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   parent_ids?: int[],
     *   variables?: array<string, string>
     * }
     */
    private function validateSendPayload(Request $request): array
    {
        $payload = $request->validate([
            'template_id' => ['required', 'integer', 'exists:center.whatsapp_templates,id'],
            'audience' => ['required', 'in:students,parents,both'],
            'section_id' => ['nullable', 'integer', 'exists:center.sections,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:center.students,id'],
            'parent_ids' => ['nullable', 'array'],
            'parent_ids.*' => ['integer', 'exists:center.parents,id'],
            'variables' => ['nullable', 'array'],
            'student_variables' => ['nullable', 'array'],
        ]);

        if (
            empty($payload['section_id'])
            && empty($payload['student_ids'])
            && empty($payload['parent_ids'])
        ) {
            abort(response()->json([
                'message' => 'Select a section or specific recipients.',
            ], 422));
        }

        return $payload;
    }

    /**
     * @param  array{
     *   template_id: int,
     *   audience: string,
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   parent_ids?: int[],
     *   variables?: array<string, string>
     * }  $payload
     * @return array{
     *   template: WhatsappTemplate,
     *   messages: list<array{
     *     recipient_type: string,
     *     recipient_id: int,
     *     name: string,
     *     phone: string,
     *     message: string,
     *     whatsapp_url: string|null
     *   }>,
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

            $phone = $this->resolvePhone($model, $type, $studentsHavePhone, $contextStudentId);
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
     * @param  array{
     *   audience: string,
     *   section_id?: int|null,
     *   student_ids?: int[],
     *   parent_ids?: int[]
     * }  $payload
     * @return \Illuminate\Support\Collection<int, array{type: string, model: Student|Parents, student_id?: int|null}>
     */
    private function resolveWhatsAppRecipients(array $payload): \Illuminate\Support\Collection
    {
        $audience = $payload['audience'];
        $studentIds = collect($payload['student_ids'] ?? [])->filter()->map(fn ($id) => (int) $id)->unique()->values();

        if ($audience === 'parents' && $studentIds->isNotEmpty()) {
            $recipients = collect();

            Student::query()
                ->whereIn('id', $studentIds)
                ->get()
                ->each(function (Student $student) use ($recipients) {
                    if (empty($student->parent_id)) {
                        return;
                    }

                    $parent = Parents::query()->find($student->parent_id);
                    if (! $parent) {
                        return;
                    }

                    $recipients->push([
                        'type' => 'parent',
                        'model' => $parent,
                        'student_id' => (int) $student->getKey(),
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
     * @return array{id: int, name: string, content: string, variables: list<string>, created_at: string|null, updated_at: string|null}
     */
    private function serializeTemplate(WhatsappTemplate $template): array
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
