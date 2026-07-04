<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    protected $namespace = 'App\Http\Controllers';

    public const HOME = '/admin';
    public const STUDENT = '/student';
    public const TEACHER = '/teacher';
    public const PARENT = '/parent';
    public const PLATFORM_ADMIN = '/platform';

    public function boot(): void
    {
        parent::boot();
    }

    public function map(): void
    {
        $this->mapApiRoutes();
        $this->mapWebRoutes();
    }

    protected function mapWebRoutes(): void
    {
        foreach (config('centers.central_domains', []) as $domain) {
            Route::domain($domain)
                ->middleware('web')
                ->namespace($this->namespace)
                ->group(base_path('routes/web.php'));
        }
    }

    protected function mapApiRoutes(): void
    {
        foreach (config('centers.central_domains', []) as $domain) {
            Route::domain($domain)
                ->prefix('api')
                ->middleware('api')
                ->namespace($this->namespace)
                ->group(base_path('routes/api.php'));
        }
    }
}
