<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Centers\CenterContextManager;
use App\Centers\CenterProvisionerService;
use App\Models\Platform\Center;
use Database\Seeders\Center\CenterSeeder;
use Database\Seeders\Center\MinimalStructureSeeder;
use Database\Seeders\Center\RolesAndPermissionsSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Seeder;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SetupCenter implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** @param  array<string, mixed>|null  $initialAccounts */
    public function __construct(
        public Center $center,
        public bool $withDemoData = false,
        public ?array $initialAccounts = null,
        public bool $seedDefaultAccounts = true,
    ) {
    }

    /** @return array{accounts: list<array<string, mixed>>} */
    public function handle(CenterContextManager $centerContext, CenterProvisionerService $provisioner): array
    {
        $center = Center::query()->find($this->center->id);
        if (! $center) {
            return ['accounts' => []];
        }

        $centerContext->initialize($center);

        try {
            if ($this->withDemoData) {
                $this->runSeeder(CenterSeeder::class);
            } else {
                $this->runSeeder(RolesAndPermissionsSeeder::class);
                $this->runSeeder(MinimalStructureSeeder::class);
            }
        } finally {
            $centerContext->end();
        }

        if ($this->withDemoData) {
            return ['accounts' => []];
        }

        if (! $this->seedDefaultAccounts && ! $this->hasInitialUsers()) {
            return ['accounts' => []];
        }

        return $provisioner->provisionDefaults(
            $center,
            $this->initialAccounts,
            $this->seedDefaultAccounts,
        );
    }

    protected function hasInitialUsers(): bool
    {
        if (! is_array($this->initialAccounts) || $this->initialAccounts === []) {
            return false;
        }

        if (! empty($this->initialAccounts['admin'])) {
            return true;
        }

        foreach (['teachers', 'parents', 'students'] as $key) {
            if (! empty($this->initialAccounts[$key])) {
                return true;
            }
        }

        return false;
    }

    /** @param  class-string<Seeder>  $class */
    protected function runSeeder(string $class): void
    {
        /** @var Seeder $seeder */
        $seeder = app($class);
        $seeder->setContainer(app());
        $seeder->run();
    }
}
