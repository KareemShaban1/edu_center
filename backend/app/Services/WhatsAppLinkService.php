<?php

declare(strict_types=1);

namespace App\Services;

class WhatsAppLinkService
{
    /**
     * @return list<string>
     */
    public function extractVariables(string $content): array
    {
        preg_match_all('/\{\{(\w+)\}\}/', $content, $matches);

        return array_values(array_unique($matches[1] ?? []));
    }

    public function normalizePhone(?string $phone, ?string $defaultCountryCode = null): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $countryCode = preg_replace('/\D/', '', (string) ($defaultCountryCode ?? config('services.whatsapp.default_country_code', '20')));
        $digits = preg_replace('/\D/', '', $phone);

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        if ($countryCode !== '' && ! str_starts_with($digits, $countryCode) && strlen($digits) === 10 && str_starts_with($digits, '1')) {
            $digits = $countryCode.$digits;
        }

        if (strlen($digits) < 10) {
            return null;
        }

        return $digits;
    }

    public function buildLink(string $phone, string $message): ?string
    {
        $normalized = $this->normalizePhone($phone);

        if ($normalized === null) {
            return null;
        }

        return 'https://wa.me/'.$normalized.'?text='.rawurlencode($message);
    }
}
