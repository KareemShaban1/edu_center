<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Collection;

final class AnnouncementRepository
{
    /**
     * @return Collection<int, Announcement>
     */
    public function allWithRelations(): Collection
    {
        return Announcement::query()
            ->with([
                'grade:id,grade_name',
                'class:id,class_name',
                'section:id,section_name',
                'media',
            ])
            ->orderByDesc('id')
            ->get();
    }

    public function find(int $id): ?Announcement
    {
        return Announcement::query()
            ->with([
                'grade:id,grade_name',
                'class:id,class_name',
                'section:id,section_name',
                'media',
            ])
            ->find($id);
    }
}
