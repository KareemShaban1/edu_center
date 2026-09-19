<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ChatMessageNotification extends Notification
{
    use Queueable;

    /** @param array<string, mixed> $meta */
    public function __construct(
        protected string $title,
        protected string $body,
        protected string $url,
        protected array $meta = [],
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return array_merge([
            'title' => $this->title,
            'body' => $this->body,
            'url' => $this->url,
            'type' => 'chat',
            'source' => 'chat',
        ], $this->meta);
    }
}
