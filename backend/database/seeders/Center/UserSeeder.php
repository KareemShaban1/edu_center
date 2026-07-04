<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Centers\CenterContext;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        $centerId = CenterContext::id();

        $user = User::withoutGlobalScopes()->updateOrCreate(
            [
                'email' => $this->defaultEmail('admin'),
                'center_id' => $centerId,
            ],
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
