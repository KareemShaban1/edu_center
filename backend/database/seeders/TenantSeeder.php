<?php

namespace Database\Seeders;

use App\Models\Platform\Tenant;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Database\Seeders\Tenant\RolesAndPermissionsSeeder;
use Database\Seeders\Tenant\UserSeeder;
use Database\Seeders\Tenant\GradeSeeder;
use Database\Seeders\Tenant\ClassesSeeder;
use Database\Seeders\Tenant\SectionsSeeder;
use Database\Seeders\Tenant\MonthsSeeder;
use Database\Seeders\Tenant\GenderSeeder;
use Database\Seeders\Tenant\SettingsSeeder;
use Database\Seeders\Tenant\ParentsSeeder;
use Database\Seeders\Tenant\StudentsSeeder;
use Database\Seeders\Tenant\TeacherSeeder;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {

        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(UserSeeder::class);
        $this->call(GradeSeeder::class);
        $this->call(ClassesSeeder::class);
        $this->call(SectionsSeeder::class);
        $this->call(MonthsSeeder::class);
        $this->call(GenderSeeder::class);
        $this->call(SettingsSeeder::class);
        $this->call(ParentsSeeder::class);
        $this->call(StudentsSeeder::class);
        $this->call(TeacherSeeder::class);

    }
}
