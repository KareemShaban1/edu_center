<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToCenter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeneratedExam extends Model
{
    use BelongsToCenter;

    protected $connection = 'center';

    protected $fillable = [
        'name',
        'grade_id',
        'class_id',
        'total_questions',
        'notes',
        'center_id',
    ];

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function lessons(): BelongsToMany
    {
        return $this->belongsToMany(Lesson::class, 'generated_exam_lessons', 'generated_exam_id', 'lesson_id')
            ->withTimestamps();
    }

    public function examQuestions(): HasMany
    {
        return $this->hasMany(GeneratedExamQuestion::class)->orderBy('sort_order');
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'generated_exam_questions', 'generated_exam_id', 'question_id')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }
}
