<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Resources\CertificationTemplateResource;
use App\Models\CertificationTemplate;
use Illuminate\Http\Exceptions\HttpResponseException;

final class CertificationTemplateService
{
    public function __construct(
        private readonly WhatsAppLinkService $variableExtractor,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function list(): array
    {
        return CertificationTemplate::query()
            ->orderByDesc('is_system')
            ->orderBy('title')
            ->get()
            ->map(fn (CertificationTemplate $template) => CertificationTemplateResource::make($template)->resolve())
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{template: array<string, mixed>}
     */
    public function create(array $payload): array
    {
        $variables = $payload['variables'] ?? $this->variableExtractor->extractVariables($payload['content']);

        $template = CertificationTemplate::query()->create([
            'title' => $payload['title'],
            'content' => $payload['content'],
            'variables' => $variables,
            'design_id' => $payload['design_id'] ?? null,
            'design' => $payload['design'] ?? null,
            'is_system' => false,
        ]);

        return ['template' => CertificationTemplateResource::make($template)->resolve()];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{template: array<string, mixed>}
     */
    public function update(int $id, array $payload): array
    {
        $template = CertificationTemplate::query()->find($id);
        if (! $template) {
            throw new HttpResponseException(
                response()->json(['message' => 'Template not found'], 404)
            );
        }

        $variables = $payload['variables'] ?? $this->variableExtractor->extractVariables($payload['content']);

        $template->update([
            'title' => $payload['title'],
            'content' => $payload['content'],
            'variables' => $variables,
            'design_id' => $payload['design_id'] ?? $template->design_id,
            'design' => $payload['design'] ?? $template->design,
        ]);

        return ['template' => CertificationTemplateResource::make($template->fresh())->resolve()];
    }

    public function delete(int $id): void
    {
        $template = CertificationTemplate::query()->find($id);
        if (! $template) {
            throw new HttpResponseException(
                response()->json(['message' => 'Template not found'], 404)
            );
        }

        $template->delete();
    }
}
