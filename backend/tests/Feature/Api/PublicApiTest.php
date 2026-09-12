<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class PublicApiTest extends TestCase
{
    public function test_config_is_public(): void
    {
        $this->apiJson('GET', '/config')
            ->assertOk()
            ->assertJsonPath('storage_mode', 'central_database');
    }

    public function test_auth_guards_is_public(): void
    {
        $this->apiJson('GET', '/auth/guards')
            ->assertOk()
            ->assertJsonStructure(['guards']);
    }

    public function test_branding_is_public(): void
    {
        $response = $this->apiJson('GET', '/branding');
        $this->assertNotEquals(500, $response->status());
        $this->assertContains($response->status(), [200, 204]);
    }

    public function test_public_centers_and_stats(): void
    {
        $this->apiJson('GET', '/public/centers')->assertOk();
        $this->apiJson('GET', '/public/stats')->assertOk();
    }

    public function test_translation_and_icon_catalogs_are_readable(): void
    {
        $this->apiJson('GET', '/ui-translations')->assertOk();
        $this->apiJson('GET', '/ui-icons')->assertOk();
        $this->apiJson('GET', '/website-images')->assertOk();
    }
}
