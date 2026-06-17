<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'admin@educenter.com'],
            [
                'name' => 'Center Admin',
                'password' => Hash::make('password'),
            ]
        );

        if (! $user->hasRole('admin')) {
            $user->assignRole('admin');
        }
    }
}
