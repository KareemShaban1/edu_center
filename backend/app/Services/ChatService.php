<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use App\Models\Parents;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Notifications\ChatMessageNotification;
use App\Support\Chat\ChatActor;
use App\Support\Chat\ChatIdentity;
use App\Support\Chat\ChatScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ChatService
{
    public function __construct(
        private readonly ChatAuthorizationService $authz,
        private readonly NotificationDispatchService $notifications,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function listConversations(ChatActor $actor): array
    {
        return ChatScope::withoutCenter(function () use ($actor) {
            $conversationIds = $this->conversationIdsForActor($actor);
            if ($conversationIds === []) {
                return [];
            }

            $conversations = ChatConversation::query()
                ->whereIn('id', $conversationIds)
                ->orderByDesc('updated_at')
                ->get();

            $participants = ChatParticipant::query()
                ->whereIn('conversation_id', $conversationIds)
                ->get()
                ->groupBy('conversation_id');

            $maxIds = ChatMessage::query()
                ->selectRaw('conversation_id, MAX(id) as max_id')
                ->whereIn('conversation_id', $conversationIds)
                ->groupBy('conversation_id')
                ->pluck('max_id');

            $lastMessages = $maxIds->isEmpty()
                ? collect()
                : ChatMessage::query()->whereIn('id', $maxIds)->get()->keyBy('conversation_id');

            $out = [];
            foreach ($conversations as $conversation) {
                $rows = $participants->get($conversation->id, collect());
                $mine = $this->myParticipant($actor, $rows);
                if (! $mine) {
                    continue;
                }

                $last = $lastMessages->get($conversation->id);
                $unread = ChatMessage::query()
                    ->where('conversation_id', $conversation->id)
                    ->where('id', '>', (int) ($mine->last_read_message_id ?: 0))
                    ->where(function ($query) use ($actor) {
                        $query->where('sender_type', '!=', $actor->type)
                            ->orWhereNotIn('sender_id', $actor->ids());
                    })
                    ->count();

                $out[] = $this->serializeConversation($conversation, $actor, $rows->all(), $last, $unread);
            }

            return $out;
        });
    }

    public function unreadCount(ChatActor $actor): int
    {
        $total = 0;
        foreach ($this->listConversations($actor) as $conversation) {
            $total += (int) ($conversation['unread_count'] ?? 0);
        }

        return $total;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function startConversation(ChatActor $actor, array $payload): array
    {
        $type = (string) ($payload['type'] ?? ChatConversation::TYPE_DIRECT);

        if ($type === ChatConversation::TYPE_GROUP) {
            return $this->createGroup($actor, $payload);
        }

        $peerType = (string) ($payload['peer_type'] ?? '');
        $peerId = (int) ($payload['peer_id'] ?? 0);
        $centerId = (int) ($payload['center_id'] ?? 0);

        if ($peerType === '' || $peerId < 1 || $centerId < 1) {
            throw new HttpException(422, 'peer_type, peer_id, and center_id are required');
        }

        if (! $this->authz->canDirectChat($actor, $peerType, $peerId, $centerId)) {
            throw new AccessDeniedHttpException('You are not allowed to chat with this person');
        }

        $identity = $actor->identityForCenter($centerId);
        if (! $identity) {
            throw new AccessDeniedHttpException('Forbidden');
        }

        return ChatScope::withoutCenter(function () use ($actor, $identity, $peerType, $peerId, $centerId) {
            $existingId = $this->findDirectConversationId($identity, $peerType, $peerId, $centerId);
            if ($existingId) {
                $conversation = ChatConversation::query()->find($existingId);
                if ($conversation) {
                    return $this->showConversation($actor, (int) $conversation->id);
                }
            }

            $conversation = ChatConversation::query()->create([
                'center_id' => $centerId,
                'type' => ChatConversation::TYPE_DIRECT,
                'title' => null,
                'created_by_type' => $identity->type,
                'created_by_id' => $identity->id,
            ]);

            ChatParticipant::query()->create([
                'center_id' => $centerId,
                'conversation_id' => $conversation->id,
                'participant_type' => $identity->type,
                'participant_id' => $identity->id,
            ]);
            ChatParticipant::query()->create([
                'center_id' => $centerId,
                'conversation_id' => $conversation->id,
                'participant_type' => $peerType,
                'participant_id' => $peerId,
            ]);

            return $this->showConversation($actor, (int) $conversation->id);
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function createGroup(ChatActor $actor, array $payload): array
    {
        if (! $actor->canCreateGroups()) {
            throw new AccessDeniedHttpException('Only admins and teachers can create groups');
        }

        $title = trim((string) ($payload['title'] ?? ''));
        $centerId = (int) ($payload['center_id'] ?? ($actor->primary()?->centerId ?? 0));
        $members = $payload['members'] ?? $payload['member_ids'] ?? [];
        if ($title === '') {
            throw new HttpException(422, 'Group title is required');
        }
        if (! $this->authz->belongsToCenter($actor, $centerId)) {
            throw new AccessDeniedHttpException('Forbidden');
        }

        $identity = $actor->identityForCenter($centerId);
        if (! $identity) {
            throw new AccessDeniedHttpException('Forbidden');
        }

        $normalized = [];
        if (is_array($members)) {
            foreach ($members as $member) {
                if (! is_array($member)) {
                    continue;
                }
                $type = (string) ($member['type'] ?? $member['peer_type'] ?? '');
                $id = (int) ($member['id'] ?? $member['peer_id'] ?? 0);
                if ($type === '' || $id < 1) {
                    continue;
                }
                if ($type === $identity->type && $id === $identity->id) {
                    continue;
                }
                if (! $this->authz->canDirectChat($actor, $type, $id, $centerId)) {
                    throw new AccessDeniedHttpException('One or more members are not allowed');
                }
                $normalized[$type.':'.$id] = ['type' => $type, 'id' => $id];
            }
        }

        if ($normalized === []) {
            throw new HttpException(422, 'Select at least one member');
        }

        return ChatScope::withoutCenter(function () use ($actor, $identity, $centerId, $title, $normalized) {
            $conversation = ChatConversation::query()->create([
                'center_id' => $centerId,
                'type' => ChatConversation::TYPE_GROUP,
                'title' => $title,
                'created_by_type' => $identity->type,
                'created_by_id' => $identity->id,
            ]);

            ChatParticipant::query()->create([
                'center_id' => $centerId,
                'conversation_id' => $conversation->id,
                'participant_type' => $identity->type,
                'participant_id' => $identity->id,
            ]);

            foreach ($normalized as $member) {
                ChatParticipant::query()->create([
                    'center_id' => $centerId,
                    'conversation_id' => $conversation->id,
                    'participant_type' => $member['type'],
                    'participant_id' => $member['id'],
                ]);
            }

            return $this->showConversation($actor, (int) $conversation->id);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function showConversation(ChatActor $actor, int $conversationId): array
    {
        return ChatScope::withoutCenter(function () use ($actor, $conversationId) {
            [$conversation, $participants, $mine] = $this->requireParticipant($actor, $conversationId);
            $last = ChatMessage::query()
                ->where('conversation_id', $conversation->id)
                ->orderByDesc('id')
                ->first();
            $unread = ChatMessage::query()
                ->where('conversation_id', $conversation->id)
                ->where('id', '>', (int) ($mine->last_read_message_id ?: 0))
                ->where(function ($query) use ($actor) {
                    $query->where('sender_type', '!=', $actor->type)
                        ->orWhereNotIn('sender_id', $actor->ids());
                })
                ->count();

            return $this->serializeConversation($conversation, $actor, $participants, $last, $unread);
        });
    }

    /**
     * @return array{messages: list<array<string, mixed>>, next_cursor: int|null}
     */
    public function listMessages(ChatActor $actor, int $conversationId, ?int $beforeId = null, int $limit = 50): array
    {
        $this->requireAccess($actor, $conversationId);

        return ChatScope::withoutCenter(function () use ($actor, $conversationId, $beforeId, $limit) {
            $limit = max(1, min(100, $limit));
            $query = ChatMessage::query()
                ->where('conversation_id', $conversationId)
                ->orderByDesc('id')
                ->limit($limit + 1);

            if ($beforeId) {
                $query->where('id', '<', $beforeId);
            }

            $rows = $query->get();
            $hasMore = $rows->count() > $limit;
            if ($hasMore) {
                $rows = $rows->slice(0, $limit);
            }

            $messages = $rows->reverse()->values()->map(fn (ChatMessage $message) => $this->serializeMessage($message, $actor))->all();

            return [
                'messages' => $messages,
                'next_cursor' => $hasMore ? (int) $rows->last()?->id : null,
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function sendMessage(
        ChatActor $actor,
        int $conversationId,
        string $type,
        ?string $body,
        ?UploadedFile $file = null,
    ): array {
        $this->requireAccess($actor, $conversationId, true);

        $type = strtolower($type);
        if (! in_array($type, [ChatMessage::TYPE_TEXT, ChatMessage::TYPE_EMOJI, ChatMessage::TYPE_IMAGE, ChatMessage::TYPE_VOICE], true)) {
            throw new HttpException(422, 'Invalid message type');
        }

        if (in_array($type, [ChatMessage::TYPE_TEXT, ChatMessage::TYPE_EMOJI], true)) {
            $body = is_string($body) ? trim(strip_tags($body)) : '';
            if ($body === '') {
                throw new HttpException(422, 'Message cannot be empty');
            }
            if (mb_strlen($body) > 4000) {
                throw new HttpException(422, 'Message is too long');
            }
        } else {
            $body = null;
            if (! $file) {
                throw new HttpException(422, 'File is required');
            }
            $this->assertUpload($type, $file);
        }

        $message = ChatScope::withoutCenter(function () use ($actor, $conversationId, $type, $body, $file) {
            $conversation = ChatConversation::query()->findOrFail($conversationId);
            $identity = $actor->identityForCenter((int) $conversation->center_id) ?? $actor->primary();
            if (! $identity) {
                throw new AccessDeniedHttpException('Forbidden');
            }

            $message = ChatMessage::query()->create([
                'center_id' => $conversation->center_id,
                'conversation_id' => $conversation->id,
                'sender_type' => $identity->type,
                'sender_id' => $identity->id,
                'type' => $type,
                'body' => $body,
            ]);

            if ($file) {
                $media = $message->addMedia($file)
                    ->usingFileName($this->safeFileName($file))
                    ->toMediaCollection((string) config('media.collections.chat', 'attachment'), 'chat');
                if ($media && $conversation->center_id) {
                    DB::connection('center')->table('media')->where('id', $media->id)->update([
                        'center_id' => $conversation->center_id,
                    ]);
                }
            }

            $conversation->touch();
            ChatParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('participant_type', $identity->type)
                ->where('participant_id', $identity->id)
                ->update(['last_read_message_id' => $message->id]);

            return $file ? $message->fresh() : $message;
        });

        dispatch(function () use ($actor, $conversationId, $message) {
            try {
                $this->notifyParticipants($actor, $conversationId, $message);
            } catch (\Throwable) {
                // Push/inbox delivery must not affect sending.
            }
        })->afterResponse();

        return $this->serializeMessage($message, $actor);
    }

    public function markRead(ChatActor $actor, int $conversationId, ?int $messageId = null): void
    {
        ChatScope::withoutCenter(function () use ($actor, $conversationId, $messageId) {
            [, $participants, $mine] = $this->requireParticipant($actor, $conversationId);
            unset($participants);

            $latest = $messageId ?: (int) ChatMessage::query()
                ->where('conversation_id', $conversationId)
                ->max('id');

            if ($latest < 1) {
                return;
            }

            $mine->last_read_message_id = max((int) $mine->last_read_message_id, $latest);
            $mine->save();
        });
    }

    public function attachment(ChatActor $actor, int $conversationId, int $mediaId): Media
    {
        $this->requireAccess($actor, $conversationId);

        return ChatScope::withoutCenter(function () use ($conversationId, $mediaId) {
            $messageIds = ChatMessage::query()
                ->where('conversation_id', $conversationId)
                ->pluck('id');

            if ($messageIds->isEmpty()) {
                throw new NotFoundHttpException('Attachment not found');
            }

            $media = Media::query()
                ->where('id', $mediaId)
                ->where('model_type', ChatMessage::class)
                ->whereIn('model_id', $messageIds)
                ->first();

            if (! $media) {
                throw new NotFoundHttpException('Attachment not found');
            }

            return $media;
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function newMessagesSince(ChatActor $actor, int $lastId): array
    {
        return ChatScope::withoutCenter(function () use ($actor, $lastId) {
            $conversationIds = $this->conversationIdsForActor($actor);
            if ($conversationIds === []) {
                return [];
            }

            return ChatMessage::query()
                ->whereIn('conversation_id', $conversationIds)
                ->where('id', '>', $lastId)
                ->orderBy('id')
                ->limit(100)
                ->get()
                ->map(fn (ChatMessage $message) => $this->serializeMessage($message, $actor))
                ->all();
        });
    }

    public function setTyping(ChatActor $actor, int $conversationId): void
    {
        $this->requireAccess($actor, $conversationId);
        $key = $this->typingCacheKey($conversationId);
        $payload = Cache::get($key, []);
        if (! is_array($payload)) {
            $payload = [];
        }
        $identity = $actor->primary();
        $actorKey = $actor->type.':'.($identity?->id ?? 0);
        $payload[$actorKey] = [
            'type' => $actor->type,
            'id' => $identity?->id,
            'name' => $actor->name,
            'until' => now()->addSeconds(5)->getTimestamp(),
        ];
        Cache::put($key, $payload, 10);
    }

    /**
     * @return list<array{type: string, id: int|null, name: string}>
     */
    public function typingActors(ChatActor $actor, int $conversationId): array
    {
        $payload = Cache::get($this->typingCacheKey($conversationId), []);
        if (! is_array($payload)) {
            return [];
        }

        $now = time();
        $out = [];
        foreach ($payload as $entry) {
            if (! is_array($entry) || (int) ($entry['until'] ?? 0) < $now) {
                continue;
            }
            if (($entry['type'] ?? '') === $actor->type && in_array((int) ($entry['id'] ?? 0), $actor->ids(), true)) {
                continue;
            }
            $out[] = [
                'type' => (string) $entry['type'],
                'id' => isset($entry['id']) ? (int) $entry['id'] : null,
                'name' => (string) ($entry['name'] ?? ''),
            ];
        }

        return $out;
    }

    /**
     * @return list<int>
     */
    public function conversationIdsForActor(ChatActor $actor): array
    {
        return ChatScope::withoutCenter(function () use ($actor) {
            $query = ChatParticipant::query();
            $query->where(function ($outer) use ($actor) {
                foreach ($actor->identities as $identity) {
                    $outer->orWhere(function ($inner) use ($identity) {
                        $inner->where('participant_type', $identity->type)
                            ->where('participant_id', $identity->id);
                    });
                }
            });

            return $query->pluck('conversation_id')->map(fn ($id) => (int) $id)->unique()->values()->all();
        });
    }

    public function requireAccess(ChatActor $actor, int $conversationId, bool $forWrite = false): ChatConversation
    {
        return ChatScope::withoutCenter(function () use ($actor, $conversationId, $forWrite) {
            [$conversation] = $this->requireParticipant($actor, $conversationId);

            if ($forWrite && $conversation->isDirect()) {
                $peer = $this->directPeer($actor, $conversationId);
                if (! $peer || ! $this->authz->canDirectChat($actor, $peer['type'], $peer['id'], (int) $conversation->center_id)) {
                    throw new AccessDeniedHttpException('You are not allowed to send messages in this conversation');
                }
            }

            if ($forWrite && $conversation->isGroup() && ! $this->authz->canAccessCenterAsMember($actor, (int) $conversation->center_id)) {
                throw new AccessDeniedHttpException('You are not allowed to send messages in this conversation');
            }

            return $conversation;
        });
    }

    /**
     * @return array{0: ChatConversation, 1: list<ChatParticipant>, 2: ChatParticipant}
     */
    private function requireParticipant(ChatActor $actor, int $conversationId): array
    {
        $conversation = ChatConversation::query()->find($conversationId);
        if (! $conversation) {
            throw new NotFoundHttpException('Conversation not found');
        }

        if (! $this->authz->belongsToCenter($actor, (int) $conversation->center_id)) {
            throw new AccessDeniedHttpException('Forbidden');
        }

        $participants = ChatParticipant::query()->where('conversation_id', $conversation->id)->get();
        $mine = $this->myParticipant($actor, $participants);
        if (! $mine) {
            throw new AccessDeniedHttpException('Forbidden');
        }

        return [$conversation, $participants->all(), $mine];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, ChatParticipant>|list<ChatParticipant>  $participants
     */
    private function myParticipant(ChatActor $actor, $participants): ?ChatParticipant
    {
        foreach ($participants as $participant) {
            if ($actor->matches($participant->participant_type, (int) $participant->participant_id)) {
                return $participant;
            }
        }

        return null;
    }

    /**
     * @return array{type: string, id: int}|null
     */
    private function directPeer(ChatActor $actor, int $conversationId): ?array
    {
        $participants = ChatParticipant::query()->where('conversation_id', $conversationId)->get();
        foreach ($participants as $participant) {
            if (! $actor->matches($participant->participant_type, (int) $participant->participant_id)) {
                return [
                    'type' => $participant->participant_type,
                    'id' => (int) $participant->participant_id,
                ];
            }
        }

        return null;
    }

    private function findDirectConversationId(ChatIdentity $identity, string $peerType, int $peerId, int $centerId): ?int
    {
        $mine = ChatParticipant::query()
            ->where('center_id', $centerId)
            ->where('participant_type', $identity->type)
            ->where('participant_id', $identity->id)
            ->pluck('conversation_id');

        if ($mine->isEmpty()) {
            return null;
        }

        $shared = ChatParticipant::query()
            ->whereIn('conversation_id', $mine)
            ->where('participant_type', $peerType)
            ->where('participant_id', $peerId)
            ->pluck('conversation_id');

        if ($shared->isEmpty()) {
            return null;
        }

        $id = ChatConversation::query()
            ->whereIn('id', $shared)
            ->where('type', ChatConversation::TYPE_DIRECT)
            ->where('center_id', $centerId)
            ->value('id');

        return $id ? (int) $id : null;
    }

    /**
     * @param  list<ChatParticipant>  $participants
     * @return array<string, mixed>
     */
    private function serializeConversation(
        ChatConversation $conversation,
        ChatActor $actor,
        array $participants,
        ?ChatMessage $last,
        int $unread,
    ): array {
        $people = $this->hydrateParticipants($participants, (int) $conversation->center_id);
        $title = $conversation->title;
        if ($conversation->isDirect()) {
            foreach ($people as $person) {
                if (! $actor->matches($person['type'], $person['id'])) {
                    $title = $person['name'];
                    break;
                }
            }
        }

        return [
            'id' => (int) $conversation->id,
            'center_id' => (int) $conversation->center_id,
            'type' => $conversation->type,
            'title' => $title,
            'participants' => $people,
            'last_message' => $last ? $this->serializeMessage($last, $actor) : null,
            'unread_count' => $unread,
            'updated_at' => optional($conversation->updated_at)?->toIso8601String(),
            'can_manage' => $conversation->isGroup() && $actor->canCreateGroups(),
        ];
    }

    /**
     * @param  list<ChatParticipant>  $participants
     * @return list<array{type: string, id: int, name: string, role: string}>
     */
    private function hydrateParticipants(array $participants, int $centerId): array
    {
        $grouped = [];
        foreach ($participants as $participant) {
            $grouped[$participant->participant_type][] = (int) $participant->participant_id;
        }

        $names = [];
        foreach ($grouped as $type => $ids) {
            $names[$type] = $this->namesFor($type, $ids);
        }

        $out = [];
        foreach ($participants as $participant) {
            $type = $participant->participant_type;
            $id = (int) $participant->participant_id;
            $out[] = [
                'type' => $type,
                'id' => $id,
                'name' => $names[$type][$id] ?? ($type.' #'.$id),
                'role' => $type,
                'center_id' => $centerId,
            ];
        }

        return $out;
    }

    /**
     * @param  list<int>  $ids
     * @return array<int, string>
     */
    private function namesFor(string $type, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        $map = [
            ChatActor::TYPE_ADMIN => ['users', 'name'],
            ChatActor::TYPE_TEACHER => ['teachers', 'name'],
            ChatActor::TYPE_STUDENT => ['students', 'name'],
            ChatActor::TYPE_PARENT => ['parents', 'parent_name'],
        ];
        if (! isset($map[$type])) {
            return [];
        }

        [$table, $column] = $map[$type];
        $rows = DB::connection('center')->table($table)->whereIn('id', $ids)->get(['id', $column.' as display_name']);
        $out = [];
        foreach ($rows as $row) {
            $out[(int) $row->id] = (string) ($row->display_name ?? '');
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMessage(ChatMessage $message, ?ChatActor $actor = null): array
    {
        $media = in_array($message->type, [ChatMessage::TYPE_IMAGE, ChatMessage::TYPE_VOICE], true)
            ? $message->getFirstMedia((string) config('media.collections.chat', 'attachment'))
            : null;

        return [
            'id' => (int) $message->id,
            'conversation_id' => (int) $message->conversation_id,
            'sender_type' => $message->sender_type,
            'sender_id' => (int) $message->sender_id,
            'type' => $message->type,
            'body' => $message->body,
            'is_mine' => $actor ? $actor->matches($message->sender_type, (int) $message->sender_id) : false,
            'created_at' => optional($message->created_at)?->toIso8601String(),
            'attachment' => $media ? [
                'id' => (int) $media->id,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => (int) $media->size,
                'url' => '/chat/conversations/'.$message->conversation_id.'/attachment/'.$media->id,
            ] : null,
        ];
    }

    private function assertUpload(string $type, UploadedFile $file): void
    {
        $mime = (string) $file->getMimeType();
        $kb = (int) ceil($file->getSize() / 1024);

        if ($type === ChatMessage::TYPE_IMAGE) {
            if (! in_array($mime, config('chat.image_mimes', []), true)) {
                throw new HttpException(422, 'Unsupported image type');
            }
            if ($kb > (int) config('chat.image_max_kb', 5120)) {
                throw new HttpException(422, 'Image is too large');
            }
        }

        if ($type === ChatMessage::TYPE_VOICE) {
            if (! in_array($mime, config('chat.voice_mimes', []), true)) {
                throw new HttpException(422, 'Unsupported audio type');
            }
            if ($kb > (int) config('chat.voice_max_kb', 8192)) {
                throw new HttpException(422, 'Voice note is too large');
            }
        }
    }

    private function safeFileName(UploadedFile $file): string
    {
        $ext = strtolower((string) $file->getClientOriginalExtension());
        $ext = preg_replace('/[^a-z0-9]/', '', $ext) ?: 'bin';

        return 'chat-'.bin2hex(random_bytes(8)).'.'.$ext;
    }

    private function notifyParticipants(ChatActor $actor, int $conversationId, ChatMessage $message): void
    {
        ChatScope::withoutCenter(function () use ($actor, $conversationId, $message) {
            $conversation = ChatConversation::query()->find($conversationId);
            if (! $conversation) {
                return;
            }

            $preview = match ($message->type) {
                ChatMessage::TYPE_IMAGE => '📷 Image',
                ChatMessage::TYPE_VOICE => '🎤 Voice message',
                ChatMessage::TYPE_EMOJI => (string) $message->body,
                default => mb_substr((string) $message->body, 0, 80),
            };

            $participants = ChatParticipant::query()->where('conversation_id', $conversationId)->get();
            foreach ($participants as $participant) {
                if ($actor->matches($participant->participant_type, (int) $participant->participant_id)) {
                    continue;
                }

                $notifiable = $this->notifiableFor($participant->participant_type, (int) $participant->participant_id);
                if (! $notifiable) {
                    continue;
                }

                $url = $this->chatUrlFor($participant->participant_type, (int) $conversation->id);
                $notification = new ChatMessageNotification(
                    $actor->name,
                    $preview,
                    $url,
                    [
                        'conversation_id' => (int) $conversation->id,
                        'message_id' => (int) $message->id,
                    ],
                );

                $this->notifications->dispatch($notifiable, $notification, true);
            }
        });
    }

    private function notifiableFor(string $type, int $id): ?Model
    {
        return match ($type) {
            ChatActor::TYPE_ADMIN => User::withoutGlobalScopes()->find($id),
            ChatActor::TYPE_TEACHER => Teacher::withoutGlobalScopes()->find($id),
            ChatActor::TYPE_STUDENT => Student::withoutGlobalScopes()->find($id),
            ChatActor::TYPE_PARENT => Parents::withoutGlobalScopes()->find($id),
            default => null,
        };
    }

    private function chatUrlFor(string $type, int $conversationId): string
    {
        $prefix = match ($type) {
            ChatActor::TYPE_ADMIN => '/admin/chat',
            ChatActor::TYPE_TEACHER => '/teacher/chat',
            ChatActor::TYPE_STUDENT => '/student/chat',
            ChatActor::TYPE_PARENT => '/parent/chat',
            default => '/chat',
        };

        return $prefix.'/'.$conversationId;
    }

    private function typingCacheKey(int $conversationId): string
    {
        return 'chat:typing:'.$conversationId;
    }
}
