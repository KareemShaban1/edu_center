<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Platform\Governorate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class PlatformGovernorateService
{
    public function isAvailable(): bool
    {
        return Schema::hasTable('governorates');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(): Collection
    {
        if (! $this->isAvailable()) {
            return collect();
        }

        return Governorate::query()
            ->withCount('cities')
            ->orderBy('name')
            ->get()
            ->map(fn (Governorate $row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'status' => ((int) $row->status) === 1 ? 'active' : 'inactive',
                'cities_count' => (int) ($row->cities_count ?? 0),
                'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
            ])
            ->values();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function store(array $payload): void
    {
        Governorate::query()->create([
            'name' => $payload['name'],
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(int $id, array $payload): bool
    {
        $row = Governorate::query()->find($id);
        if (! $row) {
            return false;
        }

        $row->update([
            'name' => $payload['name'],
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
        ]);

        return true;
    }

    public function destroy(int $id): void
    {
        Governorate::query()->whereKey($id)->delete();
    }
}
