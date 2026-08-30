<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
    use BelongsToCenter;
    use HasFactory;

    protected $connection = 'center';

    protected $fillable = [
        'question_id',
        'answer_text',
        'is_correct',
        'center_id',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
