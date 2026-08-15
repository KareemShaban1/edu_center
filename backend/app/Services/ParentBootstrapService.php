<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\MultiCenterPortalService;

final class ParentBootstrapService
{
    public function __construct(
        private readonly MultiCenterPortalService $portalService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(int $parentId): array
    {
        return $this->portalService->parentBootstrap($parentId);
    }
}
