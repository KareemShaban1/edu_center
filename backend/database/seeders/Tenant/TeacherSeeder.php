<?php

namespace Database\Seeders\Tenant;

use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TeacherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('teachers')->delete();

        Teacher::updateOrCreate(
            ['email' => 'teacher@educenter.com'],
            [
                'name' => 'Teacher 1',
                'password' => Hash::make('password'),
                'subject' => 'English',
                'address' => 'Main Branch',
                'phone' => '08121234567',
                'gender' => 'male',
                'joining_date' => now(),
            ]
        );
    }
}
