<?php

use App\Centers\CenterContextManager;
use App\Models\Platform\Center;
use Database\Seeders\Center\RolesAndPermissionsSeeder;

require dirname(__DIR__) . '/vendor/autoload.php';
$app = require dirname(__DIR__) . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$manager = $app->make(CenterContextManager::class);
$seeder = $app->make(RolesAndPermissionsSeeder::class);
$seeder->setContainer($app);

$slugs = ['demo', 'test'];
foreach ($slugs as $slug) {
    $center = Center::query()->where('slug', $slug)->first();
    if (! $center) {
        fwrite(STDOUT, "Skip {$slug}: center not found\n");
        continue;
    }

    $manager->initialize($center);
    $seeder->run();
    $manager->end();
    fwrite(STDOUT, "Seeded roles/permissions for {$slug} (id {$center->id})\n");
}
