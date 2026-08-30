<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Platform\City;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class PlatformCityService
{
    public function isAvailable(): bool
    {
        return Schema::hasTable('cities');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(?int $governorateId = null): Collection
    {
        if (! $this->isAvailable()) {
            return collect();
        }

        return City::query()
            ->with('governorate:id,name')
            ->when($governorateId, fn ($q) => $q->where('governorate_id', $governorateId))
            ->orderBy('name')
            ->get()
            ->map(fn (City $row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'governorate_id' => (int) $row->governorate_id,
                'governorate_name' => $row->governorate?->name,
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
        City::query()->create([
            'governorate_id' => (int) $payload['governorate_id'],
            'name' => $payload['name'],
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(int $id, array $payload): bool
    {
        $row = City::query()->find($id);
        if (! $row) {
            return false;
        }

        $row->update([
            'governorate_id' => (int) $payload['governorate_id'],
            'name' => $payload['name'],
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
        ]);

        return true;
    }

    public function destroy(int $id): void
    {
        City::query()->whereKey($id)->delete();
    }
}
