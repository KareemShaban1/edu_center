<?php

declare(strict_types=1);

namespace App\Providers;

use App\Centers\CenterContextManager;
use App\Centers\CenterMembershipService;
use App\Database\CenterScopedConnection;
use App\Http\Support\AuthLoginHandler;
use App\Http\Support\MultiCenterPortalService;
use Illuminate\Database\Connection;
use Illuminate\Database\MySqlConnection;
use Illuminate\Support\ServiceProvider;

class CenterServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CenterContextManager::class);
        $this->app->singleton(CenterMembershipService::class);
        $this->app->singleton(AuthLoginHandler::class);
        $this->app->singleton(MultiCenterPortalService::class);

        Connection::resolverFor('mysql', function ($connection, $database, $prefix, $config) {
            if (($config['name'] ?? '') === 'center') {
                return new CenterScopedConnection($connection, $database, $prefix, $config);
            }

            return new MySqlConnection($connection, $database, $prefix, $config);
        });
    }
}
