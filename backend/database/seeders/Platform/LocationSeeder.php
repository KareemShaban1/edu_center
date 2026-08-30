<?php

declare(strict_types=1);

namespace Database\Seeders\Platform;

use App\Models\Platform\Area;
use App\Models\Platform\City;
use App\Models\Platform\Governorate;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $qalyubia = Governorate::query()->updateOrCreate(
            ['name' => 'Qalyubia'],
            ['status' => 1],
        );

        $cairo = Governorate::query()->updateOrCreate(
            ['name' => 'Cairo'],
            ['status' => 1],
        );

        $benha = City::query()->updateOrCreate(
            ['governorate_id' => $qalyubia->id, 'name' => 'Benha'],
            ['status' => 1],
        );

        $cairoCity = City::query()->updateOrCreate(
            ['governorate_id' => $cairo->id, 'name' => 'Cairo'],
            ['status' => 1],
        );

        Area::query()->updateOrCreate(
            ['city_id' => $benha->id, 'name' => 'Benha Center'],
            ['lat' => 30.4663, 'long' => 31.1848, 'status' => 1],
        );

        Area::query()->updateOrCreate(
            ['city_id' => $cairoCity->id, 'name' => 'Nasr City'],
            ['lat' => 30.0511, 'long' => 31.3656, 'status' => 1],
        );
    }
}
