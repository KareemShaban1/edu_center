<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Resources\WhatsappTemplateResource;
use App\Models\WhatsappTemplate;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Schema;

final class WhatsAppTemplateService
{
    public function __construct(
        private readonly WhatsAppLinkService $whatsAppLinks,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function list(): array
    {
        return WhatsappTemplate::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (WhatsappTemplate $template) => WhatsappTemplateResource::make($template)->resolve())
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{template: array<string, mixed>}
     */
    public function create(array $payload): array
    {
        $variables = $payload['variables'] ?? $this->whatsAppLinks->extractVariables($payload['content']);

        $attributes = [
            'name' => $payload['name'],
            'content' => $payload['content'],
            'variables' => $variables,
        ];
        if (Schema::connection('center')->hasColumn('whatsapp_templates', 'type')) {
            $attributes['type'] = $payload['type'] ?? 'general';
        }

        $template = WhatsappTemplate::query()->create($attributes);

        return ['template' => WhatsappTemplateResource::make($template)->resolve()];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{template: array<string, mixed>}
     */
    public function update(int $id, array $payload): array
    {
        $template = WhatsappTemplate::query()->find($id);
        if (! $template) {
            throw new HttpResponseException(
                response()->json(['message' => 'Template not found'], 404)
            );
        }

        $variables = $payload['variables'] ?? $this->whatsAppLinks->extractVariables($payload['content']);

        $attributes = [
            'name' => $payload['name'],
            'content' => $payload['content'],
            'variables' => $variables,
        ];
        if (Schema::connection('center')->hasColumn('whatsapp_templates', 'type')) {
            $attributes['type'] = $payload['type'] ?? 'general';
        }

        $template->update($attributes);

        return ['template' => WhatsappTemplateResource::make($template->fresh())->resolve()];
    }

    public function delete(int $id): void
    {
        $template = WhatsappTemplate::query()->find($id);
        if (! $template) {
            throw new HttpResponseException(
                response()->json(['message' => 'Template not found'], 404)
            );
        }

        $template->delete();
    }
}
