<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Parents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ParentsSeeder extends Seeder
{
    use ClearsCenterMembershipProfiles;
    use CenterSeederSupport;

    private const PARENT_COUNT = 50;

    public function run(): void
    {
        $this->clearProfilesForCenter('parents', Parents::class);

        $defaultParent = new Parents();
        $defaultParent->email = $this->defaultEmail('parent');
        $defaultParent->password = Hash::make('password');
        $defaultParent->parent_name = 'شعبان عبد المنعم';
        $defaultParent->parent_phone = $this->parentPhone(1);
        $defaultParent->parent_job = 'مهندس';
        $defaultParent->parent_address = 'بنها';
        $defaultParent->save();
        $this->registerParentMembership((int) $defaultParent->id);

        $faker = \Faker\Factory::create('ar_SA');

        for ($i = 2; $i <= self::PARENT_COUNT; $i++) {
            $parent = new Parents();
            $parent->email = $faker->unique()->safeEmail();
            $parent->password = Hash::make('password');
            $parent->parent_name = $faker->name();
            $parent->parent_phone = $this->parentPhone($i);
            $parent->parent_job = $faker->jobTitle();
            $parent->parent_address = $faker->city();
            $parent->save();
            $this->registerParentMembership((int) $parent->id);
        }
    }
}
