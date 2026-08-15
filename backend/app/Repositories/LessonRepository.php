<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Lesson;

final class LessonRepository
{
    public function find(int $id): ?Lesson
    {
        return Lesson::query()
            ->with('media')
            ->find($id);
    }
}
