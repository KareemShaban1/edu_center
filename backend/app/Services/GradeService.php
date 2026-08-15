<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\Grade;
use App\Models\Platform\Center;
use Illuminate\Support\Facades\DB;

final class GradeService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(array $payload, Center $tenant): Grade
    {
        return DB::connection('center')->transaction(function () use ($payload, $tenant): Grade {
            $grade = new Grade();
            $grade->grade_name = (string) $payload['name'];
            $grade->notes = $payload['notes'] ?? null;
            CenterIdAssigner::assign($grade, (int) $tenant->id);
            $grade->save();

            return $grade;
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(Grade $grade, array $payload, Center $tenant): Grade
    {
        return DB::connection('center')->transaction(function () use ($grade, $payload, $tenant): Grade {
            $grade->grade_name = (string) $payload['name'];
            $grade->notes = $payload['notes'] ?? null;
            CenterIdAssigner::assign($grade, (int) $tenant->id, onlyIfMissing: true);
            $grade->save();

            return $grade;
        });
    }

    public function delete(Grade $grade): void
    {
        $grade->delete();
    }
}
