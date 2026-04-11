<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ImportProgressEvent implements ShouldBroadcast
{
    use SerializesModels;

    public $progress;
    public $success;
    public $failed;

    public function __construct($progress, $success, $failed)
    {
        $this->progress = $progress;
        $this->success = $success;
        $this->failed  = $failed;
    }

    public function broadcastOn()
    {
        return new Channel('import-progress');
    }
}
