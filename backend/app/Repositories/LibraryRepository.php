<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Library;
use Illuminate\Database\Eloquent\Collection;

final class LibraryRepository
{
    /**
     * @return Collection<int, Library>
     */
    public function allWithRelations(): Collection
    {
        return Library::query()
            ->with([
                'grade:id,grade_name',
                'class:id,class_name',
                'section:id,section_name',
                'media',
            ])
            ->orderByDesc('id')
            ->get();
    }

    public function find(int $id): ?Library
    {
        return Library::query()
            ->with([
                'grade:id,grade_name',
                'class:id,class_name',
                'section:id,section_name',
                'media',
            ])
            ->find($id);
    }
}
