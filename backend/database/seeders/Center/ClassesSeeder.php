<?php

namespace Database\Seeders\Center;

use App\Models\Classes;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClassesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        //
        Classes::query()->delete();
        $classes = [
            'الصف الاول',
            'الصف الثاني',
            'الصف الثالث',
        ];



        foreach ($classes as $class) {
            Classes::create([
                'class_name' => $class,
                'grade_id' => 1
            ]);
            
        }


        foreach ($classes as $class) {
           
            Classes::create([
                'class_name' => $class,
                'grade_id' => 2
            ]);
            
        }

        foreach ($classes as $class) {
           
            Classes::create([
                'class_name' => $class,
                'grade_id' => 3
            ]);
        }
    
    }
}
