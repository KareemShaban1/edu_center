<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $studentId;
    public $newStatus;

    public function __construct($studentId, $newStatus)
    {
        $this->studentId = $studentId;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new PrivateChannel('student.' . $this->studentId);
    }
    public function broadcastAs()
    {
        return 'statusChanged';
    }

    public function broadcastWith()
    {
        return [
            'studentId' => $this->studentId,
            'newStatus' => $this->newStatus,
        ];
    }
}