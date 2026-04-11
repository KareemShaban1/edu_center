<?php
namespace Database\Seeders\Tenant;

use App\Models\Parents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ParentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('parents')->delete();
        
        // default parent
        $parent = new Parents();
        $parent->email = 'parent@educenter.com';
        $parent->password = Hash::make('password');
        $parent->parent_name = 'شعبان عبد المنعم';
        $parent->parent_phone = '01222796987';
        $parent->parent_job = 'مدرس';
        $parent->parent_address = 'بنها';
        $parent->save();

        $faker = \Faker\Factory::create('ar_SA');
        for ($i = 0; $i < 100; $i++) {
            $parent = new Parents();
            $parent->email = $faker->unique()->safeEmail;
            $parent->password = Hash::make('password');
            $parent->parent_name = $faker->name;
            $parent->parent_phone = $faker->unique()->phoneNumber;
            $parent->parent_job = $faker->jobTitle;
            $parent->parent_address = $faker->city;
            $parent->save();
        }

    }
}
