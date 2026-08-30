<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Platform\Area;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class PlatformAreaService
{
    public function isAvailable(): bool
    {
        return Schema::hasTable('areas');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(?int $cityId = null): Collection
    {
        if (! $this->isAvailable()) {
            return collect();
        }

        return Area::query()
            ->with(['city:id,name,governorate_id', 'city.governorate:id,name'])
            ->when($cityId, fn ($q) => $q->where('city_id', $cityId))
            ->orderBy('name')
            ->get()
            ->map(fn (Area $row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'city_id' => (int) $row->city_id,
                'city_name' => $row->city?->name,
                'governorate_id' => $row->city?->governorate_id ? (int) $row->city->governorate_id : null,
                'governorate_name' => $row->city?->governorate?->name,
                'lat' => $row->lat,
                'long' => $row->long,
                'status' => ((int) $row->status) === 1 ? 'active' : 'inactive',
                'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
            ])
            ->values();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function store(array $payload): void
    {
        Area::query()->create([
            'city_id' => (int) $payload['city_id'],
            'name' => $payload['name'],
            'lat' => $payload['lat'] ?? null,
            'long' => $payload['long'] ?? null,
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(int $id, array $payload): bool
    {
        $row = Area::query()->find($id);
        if (! $row) {
            return false;
        }

        $row->update([
            'city_id' => (int) $payload['city_id'],
            'name' => $payload['name'],
            'lat' => $payload['lat'] ?? null,
            'long' => $payload['long'] ?? null,
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
        ]);

        return true;
    }

    public function destroy(int $id): void
    {
        Area::query()->whereKey($id)->delete();
    }
}
