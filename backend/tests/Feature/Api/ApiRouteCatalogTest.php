<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ApiRouteCatalogTest extends TestCase
{
    public function test_api_routes_are_registered_from_split_files(): void
    {
        $uris = collect($this->apiRouteInventory())->pluck('uri');

        $this->assertGreaterThan(100, $uris->unique()->count(), 'Expected the split API route files to be registered.');
        $this->assertTrue($uris->contains('api/login'));
        $this->assertTrue($uris->contains('api/admin/bootstrap'));
        $this->assertTrue($uris->contains('api/teacher/bootstrap'));
        $this->assertTrue($uris->contains('api/student/bootstrap'));
        $this->assertTrue($uris->contains('api/parent/bootstrap'));
        $this->assertTrue($uris->contains('api/platform/centers'));
        $this->assertTrue($uris->contains('api/public/centers'));
    }
}
