<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class AuthApiTest extends TestCase
{
    public function test_login_requires_credentials(): void
    {
        $this->apiJson('POST', '/login', [])
            ->assertStatus(422);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $response = $this->apiJson('POST', '/login', [
            'email' => 'nobody@example.test',
            'password' => 'wrong-password',
            'guard' => 'users',
        ]);

        $this->assertNotEquals(500, $response->status());
        $this->assertContains($response->status(), [401, 403, 422]);
    }

    public function test_current_user_requires_authentication(): void
    {
        $this->apiJson('GET', '/user')
            ->assertStatus(401);
    }

    public function test_logout_without_session_does_not_crash(): void
    {
        $response = $this->apiJson('POST', '/logout');
        $this->assertNotEquals(500, $response->status());
        $this->assertContains($response->status(), [200, 401]);
    }
}
