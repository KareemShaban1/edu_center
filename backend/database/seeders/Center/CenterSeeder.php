<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use Illuminate\Database\Seeder;

class CenterSeeder extends Seeder
{
    /**
     * Seed demo data for the active center (grades, students, teachers, etc.).
     * Requires center context — run via SetupCenter or after CenterContextManager::initialize().
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            UserSeeder::class,
            GradeSeeder::class,
            ClassesSeeder::class,
            SectionsSeeder::class,
            MonthsSeeder::class,
            GenderSeeder::class,
            SettingsSeeder::class,
            ParentsSeeder::class,
            StudentsSeeder::class,
            TeacherSeeder::class,
            DashboardDataSeeder::class,
            CertificateTemplateSeeder::class,
        ]);
    }
}
