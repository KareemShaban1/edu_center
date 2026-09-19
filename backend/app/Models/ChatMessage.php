<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ChatMessage extends Model implements HasMedia
{
    use BelongsToCenter;
    use InteractsWithMedia;

    protected $connection = 'center';

    protected $fillable = [
        'center_id',
        'conversation_id',
        'sender_type',
        'sender_id',
        'type',
        'body',
    ];

    public const TYPE_TEXT = 'text';

    public const TYPE_EMOJI = 'emoji';

    public const TYPE_IMAGE = 'image';

    public const TYPE_VOICE = 'voice';

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection((string) config('media.collections.chat', 'attachment'))
            ->useDisk('chat')
            ->singleFile();
    }
}
