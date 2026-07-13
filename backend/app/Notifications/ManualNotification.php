<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ManualNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    /** @param array<string, mixed> $meta */
    public function __construct(
        protected string $title,
        protected string $body,
        protected ?string $url = null,
        protected array $meta = [],
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return array_merge([
            'title' => $this->title,
            'body' => $this->body,
            'url' => $this->url,
            'type' => 'manual',
            'source' => 'manual',
        ], $this->meta);
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
