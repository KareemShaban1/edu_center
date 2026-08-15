<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\MultiCenterPortalService;

final class ParentPortalService
{
    public function __construct(
        private readonly MultiCenterPortalService $portalService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function portal(string $email, string $userType): array
    {
        return $this->portalService->parentPortal($email, $userType);
    }
}
