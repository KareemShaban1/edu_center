<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppEvolutionService
{
    public function mode(): string
    {
        return (string) config('services.whatsapp.mode', 'link');
    }

    public function isConfigured(): bool
    {
        if ($this->mode() !== 'evolution') {
            return false;
        }

        return $this->baseUrl() !== ''
            && $this->instance() !== ''
            && $this->apiKey() !== '';
    }

    /**
     * @return array{configured: bool, connected: bool, state: string|null, error: string|null}
     */
    public function status(): array
    {
        if (! $this->isConfigured()) {
            return [
                'configured' => false,
                'connected' => false,
                'state' => null,
                'error' => 'Evolution API is not configured.',
            ];
        }

        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(8)
                ->get($this->baseUrl().'/instance/connectionState/'.$this->instance());

            if (! $response->successful()) {
                return [
                    'configured' => true,
                    'connected' => false,
                    'state' => null,
                    'error' => 'Could not reach Evolution API.',
                ];
            }

            $payload = $response->json();
            $state = is_array($payload)
                ? (string) ($payload['instance']['state'] ?? $payload['state'] ?? '')
                : '';

            $connected = in_array(strtolower($state), ['open', 'connected'], true);

            return [
                'configured' => true,
                'connected' => $connected,
                'state' => $state !== '' ? $state : null,
                'error' => $connected ? null : 'WhatsApp instance is not connected. Scan the QR code in Evolution API.',
            ];
        } catch (\Throwable $e) {
            Log::warning('WhatsApp Evolution status check failed', ['error' => $e->getMessage()]);

            return [
                'configured' => true,
                'connected' => false,
                'state' => null,
                'error' => 'Evolution API unreachable.',
            ];
        }
    }

    /**
     * @return array{success: bool, error: string|null}
     */
    public function sendText(string $phone, string $message): array
    {
        if (! $this->isConfigured()) {
            return ['success' => false, 'error' => 'Automatic WhatsApp sending is not configured.'];
        }

        $normalized = app(WhatsAppLinkService::class)->normalizePhone($phone);
        if ($normalized === null) {
            return ['success' => false, 'error' => 'Invalid phone number.'];
        }

        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(20)
                ->post($this->baseUrl().'/message/sendText/'.$this->instance(), [
                    'number' => $normalized,
                    'text' => $message,
                ]);

            if ($response->successful()) {
                return ['success' => true, 'error' => null];
            }

            $body = $response->json();
            $error = is_array($body)
                ? (string) ($body['message'] ?? $body['error'] ?? $response->body())
                : $response->body();

            Log::warning('WhatsApp Evolution send failed', [
                'phone' => $normalized,
                'status' => $response->status(),
                'error' => $error,
            ]);

            return ['success' => false, 'error' => $error !== '' ? $error : 'Send request failed.'];
        } catch (\Throwable $e) {
            Log::error('WhatsApp Evolution send exception', [
                'phone' => $normalized,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function sendDelayMicroseconds(): int
    {
        $ms = (int) config('services.whatsapp.send_delay_ms', 1500);

        return max(0, $ms) * 1000;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.whatsapp.base_url', ''), '/');
    }

    private function instance(): string
    {
        return (string) config('services.whatsapp.instance', '');
    }

    private function apiKey(): string
    {
        return (string) config('services.whatsapp.api_key', '');
    }

    /**
     * @return array<string, string>
     */
    private function headers(): array
    {
        return [
            'apikey' => $this->apiKey(),
            'Content-Type' => 'application/json',
        ];
    }
}
