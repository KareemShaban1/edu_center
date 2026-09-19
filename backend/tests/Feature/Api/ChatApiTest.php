<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ChatApiTest extends TestCase
{
    public function test_chat_routes_are_registered(): void
    {
        $uris = collect($this->apiRouteInventory())->pluck('uri');

        $this->assertTrue($uris->contains('api/chat/contacts'));
        $this->assertTrue($uris->contains('api/chat/conversations'));
        $this->assertTrue($uris->contains('api/chat/stream'));
        $this->assertTrue($uris->contains('api/chat/unread'));
    }

    public function test_chat_endpoints_require_authentication(): void
    {
        $this->apiJson('GET', '/chat/contacts')->assertStatus(401);
        $this->apiJson('GET', '/chat/conversations')->assertStatus(401);
        $this->apiJson('POST', '/chat/conversations', ['type' => 'direct'])->assertStatus(401);
        $this->apiJson('GET', '/chat/conversations/1/messages')->assertStatus(401);
        $this->apiJson('POST', '/chat/conversations/1/messages', ['type' => 'text', 'body' => 'hi'])->assertStatus(401);
        $this->apiJson('GET', '/chat/conversations/1/attachment/1')->assertStatus(401);
        $this->apiJson('GET', '/chat/stream')->assertStatus(401);
    }
}
