<?php

namespace Tests\Unit;

use App\Services\ChatAuthorizationService;
use App\Support\Chat\ChatActor;
use PHPUnit\Framework\TestCase;

class ChatAuthorizationServiceTest extends TestCase
{
    public function test_staff_can_message_learners_and_other_staff(): void
    {
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_ADMIN, ChatActor::TYPE_TEACHER));
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_ADMIN, ChatActor::TYPE_STUDENT));
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_ADMIN, ChatActor::TYPE_PARENT));
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_TEACHER, ChatActor::TYPE_TEACHER));
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_TEACHER, ChatActor::TYPE_STUDENT));
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_TEACHER, ChatActor::TYPE_PARENT));
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_STUDENT, ChatActor::TYPE_ADMIN));
        $this->assertTrue(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_PARENT, ChatActor::TYPE_TEACHER));
    }

    public function test_learners_cannot_message_each_other(): void
    {
        $this->assertFalse(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_STUDENT, ChatActor::TYPE_STUDENT));
        $this->assertFalse(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_PARENT, ChatActor::TYPE_PARENT));
        $this->assertFalse(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_STUDENT, ChatActor::TYPE_PARENT));
        $this->assertFalse(ChatAuthorizationService::pairAllowed(ChatActor::TYPE_PARENT, ChatActor::TYPE_STUDENT));
    }

    public function test_only_staff_can_create_groups(): void
    {
        $this->assertTrue(ChatAuthorizationService::canCreateGroup(ChatActor::TYPE_ADMIN));
        $this->assertTrue(ChatAuthorizationService::canCreateGroup(ChatActor::TYPE_TEACHER));
        $this->assertFalse(ChatAuthorizationService::canCreateGroup(ChatActor::TYPE_STUDENT));
        $this->assertFalse(ChatAuthorizationService::canCreateGroup(ChatActor::TYPE_PARENT));
    }
}
