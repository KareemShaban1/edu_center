<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedExamQuestion extends Model
{
    protected $connection = 'center';

    protected $fillable = [
        'generated_exam_id',
        'question_id',
        'sort_order',
    ];

    public function generatedExam(): BelongsTo
    {
        return $this->belongsTo(GeneratedExam::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
