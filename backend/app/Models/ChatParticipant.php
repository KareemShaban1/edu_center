<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatParticipant extends Model
{
    use BelongsToCenter;

    protected $connection = 'center';

    protected $fillable = [
        'center_id',
        'conversation_id',
        'participant_type',
        'participant_id',
        'last_read_message_id',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }
}
