<?php

namespace Database\Seeders\Tenant;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MonthsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        //
        DB::table('months')->delete();

        $data = [
            ['title' => 'شهر يناير', 'value' => '1'],
            ['title' => 'شهر فبراير', 'value' => '2'],
            ['title' => 'شهر مارس', 'value' => '3'],
            ['title' => 'شهر أبريل', 'value' => '4'],
            ['title' => 'شهر مايو', 'value' => '5'],
            ['title' => 'شهر يونيو', 'value' => '6'],
            ['title' => 'شهر يوليو', 'value' => '7'],
            ['title' => 'شهر أغسطس', 'value' => '8'],
            ['title' => 'شهر سبتمبر', 'value' => '9'],
            ['title' => 'شهر أكتوبر', 'value' => '10'],
            ['title' => 'شهر نوفمبر', 'value' => '11'],
            ['title' => 'شهر ديسمبر', 'value' => '12'],
        ];

        DB::table('months')->insert($data);
    }
}
