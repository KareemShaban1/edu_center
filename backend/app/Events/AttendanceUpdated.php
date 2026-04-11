<?php

namespace App\Events; // Or App\Attendance (if using custom directory)

use Illuminate\Support\Collection;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesJobs;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class AttendanceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public $student;
    public $attendanceStatus;

    public function __construct($id, $attendanceStatus)
    {
        $this->student = $id;
        $this->attendanceStatus = $attendanceStatus;
    }

    public function broadcastOn(): Channel|array|Collection
    {
        return new PrivateChannel('student.' . $this->student);
    }

    public function broadcastAs(): string
    {
        return 'attendance-update';
    }
}