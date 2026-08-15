<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterMembershipService;
use App\Models\Parents;
use App\Models\Platform\Center;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

final class ParentService
{
    public function __construct(
        private readonly CenterMembershipService $centerMembershipService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(array $payload, Center $tenant): Parents
    {
        $parent = DB::connection('center')->transaction(function () use ($payload, $tenant): Parents {
            $parent = new Parents();
            $this->fillParent($parent, $payload, includePassword: true);
            $parent->save();

            $this->centerMembershipService->assignMembership($tenant, (int) $parent->id, Parents::class);

            return $parent->fresh() ?? $parent;
        });

        return $this->decorateParentResponse($parent, $payload['status'] ?? 'active');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(Parents $parent, array $payload): Parents
    {
        DB::connection('center')->transaction(function () use ($parent, $payload): void {
            $this->fillParent($parent, $payload, includePassword: ! empty($payload['password']));
            $parent->save();
        });

        $parent = $parent->fresh() ?? $parent;

        return $this->decorateParentResponse($parent, $payload['status'] ?? 'active');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillParent(Parents $parent, array $payload, bool $includePassword): void
    {
        $parent->parent_name = (string) $payload['name'];
        $parent->email = (string) $payload['email'];
        $parent->parent_phone = $payload['phone'] ?? null;
        $parent->parent_job = $payload['job_title'] ?? null;
        $parent->parent_address = $payload['address'] ?? null;

        if (Schema::connection('center')->hasColumn('parents', 'is_active')) {
            $parent->is_active = ($payload['status'] ?? 'active') === 'active';
        }

        if ($includePassword && ! empty($payload['password'])) {
            $parent->password = Hash::make((string) $payload['password']);
        }
    }

    private function decorateParentResponse(Parents $parent, string $fallbackStatus): Parents
    {
        $parent->setAttribute('api_status', $this->resolveStatus($parent, $fallbackStatus));

        return $parent;
    }

    private function resolveStatus(Parents $parent, string $fallbackStatus): string
    {
        if (Schema::connection('center')->hasColumn('parents', 'is_active')) {
            return $parent->is_active ? 'active' : 'inactive';
        }

        return $fallbackStatus;
    }
}
