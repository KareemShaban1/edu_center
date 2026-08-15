<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\Platform\Center;
use App\Models\Unit;
use App\Repositories\UnitRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class UnitService
{
    public function __construct(
        private readonly UnitRepository $unitRepository,
        private readonly MediaService $mediaService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     */
    public function create(array $payload, array $uploadedFiles, Center $tenant): Unit
    {
        $collection = (string) config('media.collections.units');

        $unit = DB::connection('center')->transaction(function () use ($payload, $uploadedFiles, $tenant, $collection): Unit {
            $unit = new Unit();
            $this->fillUnit($unit, $payload);
            CenterIdAssigner::assign($unit, (int) $tenant->id);
            $unit->save();

            $this->mediaService->sync($unit, $collection, $uploadedFiles);

            return $unit;
        });

        return $this->unitRepository->find((int) $unit->id) ?? $unit->load('media');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<UploadedFile>  $uploadedFiles
     * @param  list<int>  $removeMediaIds
     */
    public function update(
        Unit $unit,
        array $payload,
        array $uploadedFiles,
        array $removeMediaIds,
        Center $tenant,
    ): Unit {
        $collection = (string) config('media.collections.units');

        DB::connection('center')->transaction(function () use (
            $unit,
            $payload,
            $uploadedFiles,
            $removeMediaIds,
            $tenant,
            $collection,
        ): void {
            $this->fillUnit($unit, $payload);
            CenterIdAssigner::assign($unit, (int) $tenant->id, onlyIfMissing: true);
            $unit->save();

            $this->mediaService->sync($unit, $collection, $uploadedFiles, $removeMediaIds);
        });

        return $this->unitRepository->find((int) $unit->id) ?? $unit->fresh(['media']);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateBasic(Unit $unit, array $payload, Center $tenant): Unit
    {
        DB::connection('center')->transaction(function () use ($unit, $payload, $tenant): void {
            $this->fillUnit($unit, $payload);
            CenterIdAssigner::assign($unit, (int) $tenant->id, onlyIfMissing: true);
            $unit->save();
        });

        return $unit->fresh() ?? $unit;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillUnit(Unit $unit, array $payload): void
    {
        $unit->name = (string) $payload['name'];
        $unit->class_id = (int) $payload['class_id'];
        $unit->notes = $payload['notes'] ?? '';
    }
}
