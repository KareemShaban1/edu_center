<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\CenterIdAssigner;
use App\Models\Classes;
use App\Models\Platform\Center;
use Illuminate\Support\Facades\DB;

final class ClassService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(array $payload, Center $tenant): Classes
    {
        return DB::connection('center')->transaction(function () use ($payload, $tenant): Classes {
            $class = new Classes();
            $this->fillClass($class, $payload);
            CenterIdAssigner::assign($class, (int) $tenant->id);
            $class->save();

            return $class;
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(Classes $class, array $payload, Center $tenant): Classes
    {
        return DB::connection('center')->transaction(function () use ($class, $payload, $tenant): Classes {
            $this->fillClass($class, $payload);
            CenterIdAssigner::assign($class, (int) $tenant->id, onlyIfMissing: true);
            $class->save();

            return $class;
        });
    }

    public function delete(Classes $class): void
    {
        $class->delete();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fillClass(Classes $class, array $payload): void
    {
        $class->class_name = (string) $payload['name'];
        $class->grade_id = (int) $payload['grade_id'];
        $class->setAttribute('notes', $payload['notes'] ?? null);
    }
}
