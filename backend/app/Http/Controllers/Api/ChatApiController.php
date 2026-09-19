<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChatActorResolver;
use App\Services\ChatAuthorizationService;
use App\Services\ChatService;
use App\Support\Chat\ChatActor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class ChatApiController extends Controller
{
    public function __construct(
        private readonly ChatActorResolver $actors,
        private readonly ChatAuthorizationService $authz,
        private readonly ChatService $chat,
    ) {}

    public function contacts(Request $request): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $centerId = $request->query('center_id');
        $search = $request->query('q');

        return response()->json([
            'contacts' => $this->authz->listContacts(
                $actor,
                is_string($search) ? $search : null,
                is_numeric($centerId) ? (int) $centerId : null,
            ),
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $conversations = $this->chat->listConversations($actor);

        return response()->json([
            'conversations' => $conversations,
            'unread_count' => array_sum(array_map(
                static fn (array $row): int => (int) ($row['unread_count'] ?? 0),
                $conversations
            )),
        ]);
    }

    public function unread(Request $request): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        return response()->json(['unread_count' => $this->chat->unreadCount($actor)]);
    }

    public function storeConversation(Request $request): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        try {
            $conversation = $this->chat->startConversation($actor, $request->all());
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        return response()->json(['conversation' => $conversation], 201);
    }

    public function showConversation(Request $request, int $id): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        try {
            return response()->json(['conversation' => $this->chat->showConversation($actor, $id)]);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    public function messages(Request $request, int $id): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        try {
            $before = $request->query('before_id');

            return response()->json($this->chat->listMessages(
                $actor,
                $id,
                is_numeric($before) ? (int) $before : null,
                (int) $request->query('limit', 50),
            ));
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    public function storeMessage(Request $request, int $id): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $rateKey = 'chat-send:'.$actor->type.':'.implode('-', $actor->ids());
        $max = (int) config('chat.send_per_minute', 30);
        if (RateLimiter::tooManyAttempts($rateKey, $max)) {
            return response()->json(['message' => 'Too many messages'], 429);
        }
        RateLimiter::hit($rateKey, 60);

        $type = (string) $request->input('type', 'text');
        $body = $request->input('body');
        $file = $request->file('file');

        try {
            $message = $this->chat->sendMessage(
                $actor,
                $id,
                $type,
                is_string($body) ? $body : null,
                $file,
            );
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        return response()->json(['message' => $message], 201);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        try {
            $messageId = $request->input('message_id');
            $this->chat->markRead($actor, $id, is_numeric($messageId) ? (int) $messageId : null);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        return response()->json(['ok' => true]);
    }

    public function typing(Request $request, int $id): JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        try {
            $this->chat->setTyping($actor, $id);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        return response()->json(['ok' => true]);
    }

    public function attachment(Request $request, int $id, int $mediaId)
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        try {
            $media = $this->chat->attachment($actor, $id, $mediaId);
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        $path = $media->getPath();
        if (! is_string($path) || $path === '' || ! is_readable($path)) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        return response()->file($path, [
            'Content-Type' => (string) ($media->mime_type ?: 'application/octet-stream'),
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function stream(Request $request): StreamedResponse|JsonResponse
    {
        $actor = $this->actorOrFail($request);
        if ($actor instanceof JsonResponse) {
            return $actor;
        }

        $lastId = (int) $request->query('last_id', 0);
        $seconds = (int) config('chat.sse_seconds', 25);
        $pollMs = (int) config('chat.sse_poll_ms', 800);

        return response()->stream(function () use ($actor, $lastId, $seconds, $pollMs) {
            @ini_set('output_buffering', 'off');
            @ini_set('zlib.output_compression', '0');
            while (ob_get_level() > 0) {
                ob_end_flush();
            }

            $deadline = time() + max(5, $seconds);
            $lastTyping = '';

            echo "event: ping\ndata: {}\n\n";
            $this->flushSse();

            while (time() < $deadline) {
                if (connection_aborted()) {
                    break;
                }

                try {
                    $messages = $this->chat->newMessagesSince($actor, $lastId);
                    foreach ($messages as $message) {
                        $lastId = max($lastId, (int) $message['id']);
                        echo 'event: message.created'."\n";
                        echo 'data: '.json_encode($message, JSON_UNESCAPED_UNICODE)."\n\n";
                    }

                    $typingPayload = [];
                    foreach ($this->chat->conversationIdsForActor($actor) as $conversationId) {
                        $people = $this->chat->typingActors($actor, $conversationId);
                        if ($people !== []) {
                            $typingPayload[] = [
                                'conversation_id' => $conversationId,
                                'actors' => $people,
                            ];
                        }
                    }
                    $typingJson = json_encode($typingPayload, JSON_UNESCAPED_UNICODE);
                    if ($typingJson !== $lastTyping) {
                        $lastTyping = $typingJson;
                        echo "event: typing\ndata: {$typingJson}\n\n";
                    }
                } catch (Throwable) {
                    echo "event: error\ndata: {\"message\":\"stream failed\"}\n\n";
                    $this->flushSse();
                    break;
                }

                echo "event: ping\ndata: {}\n\n";
                $this->flushSse();
                usleep(max(200, $pollMs) * 1000);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream; charset=UTF-8',
            'Cache-Control' => 'no-cache, no-store',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function flushSse(): void
    {
        if (ob_get_level() > 0) {
            @ob_flush();
        }
        flush();
    }

    private function actorOrFail(Request $request): ChatActor|JsonResponse
    {
        $guard = (string) $request->session()->get('api_auth_guard', '');
        if (! in_array($guard, ['web', 'teacher', 'student', 'parent'], true)) {
            $bearer = \App\Http\Support\ApiBearerAuth::resolve($request);
            $guard = (string) ($bearer['guard'] ?? '');
            if (! in_array($guard, ['web', 'teacher', 'student', 'parent'], true)) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
        }

        $actor = $this->actors->fromRequest($request);
        if (! $actor) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return $actor;
    }
}
