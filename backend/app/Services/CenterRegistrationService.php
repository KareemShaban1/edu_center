<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\SetupCenter;
use App\Models\Platform\Center;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CenterRegistrationService
{
    private const RESERVED_SLUGS = [
        'admin', 'teacher', 'student', 'parent', 'platform', 'login', 'register',
        'api', 'p', 'center', 'guide', 'developer', 'www',
    ];

    /**
     * @param  array<string, mixed>  $payload
     * @return array{center: Center, accounts: list<array<string, mixed>>}
     */
    public function create(array $payload): array
    {
        $slug = $this->uniqueSlug($payload['slug'] ?? null, (string) $payload['name']);
        $plan = $payload['plan'] ?? 'Starter';
        $statusActive = ($payload['status'] ?? 'active') === 'active';

        $center = Center::query()->create([
            'name' => $payload['name'],
            'slug' => $slug,
            'domain' => $payload['domain'] ?? ($slug.'.localhost'),
            'email' => $payload['email'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'status' => $statusActive ? 1 : 0,
            'data' => [
                'plan' => $plan,
                'subscription' => [
                    'plan' => $plan,
                    'amount' => 0,
                    'billing_cycle' => 'monthly',
                    'status' => $statusActive ? 'trial' : 'cancelled',
                    'next_billing_date' => now()->addMonth()->toDateString(),
                ],
            ],
        ]);

        $seedDefaults = array_key_exists('seed_default_accounts', $payload)
            ? (bool) $payload['seed_default_accounts']
            : true;

        $provisionResult = SetupCenter::dispatchSync(
            $center,
            false,
            $payload['initial_users'] ?? null,
            $seedDefaults,
        );

        return [
            'center' => $center,
            'accounts' => is_array($provisionResult) ? ($provisionResult['accounts'] ?? []) : [],
        ];
    }

    /**
     * @throws ValidationException
     */
    public function assertAdminEmailAvailable(string $email): void
    {
        if (Schema::connection('mysql')->hasTable('users')
            && DB::connection('mysql')->table('users')->where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered.'],
            ]);
        }
    }

    public function uniqueSlug(?string $requested, string $name): string
    {
        $slug = $requested ? Str::slug($requested) : Str::slug($name);
        if (! $slug || in_array($slug, self::RESERVED_SLUGS, true)) {
            $slug = 'center-'.Str::lower(Str::random(6));
        }

        while (Center::query()->where('slug', $slug)->exists() || in_array($slug, self::RESERVED_SLUGS, true)) {
            $slug = $slug.'-'.Str::lower(Str::random(4));
        }

        return $slug;
    }
}
