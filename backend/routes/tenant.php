<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomainOrSubdomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/


Broadcast::routes([
    'middleware' => [
        'web',
        'auth:parent',
        InitializeTenancyByDomain::class,
        PreventAccessFromCentralDomains::class,
    ],
]);
Route::middleware([
    'web',
    InitializeTenancyByDomainOrSubdomain::class,
    PreventAccessFromCentralDomains::class,
])
    ->namespace('App\Http\Controllers')
    ->group(function () {
        // Route::get('/', function () {
        //     return 'This is your multi-tenant application. The id of the current tenant is ' . tenant('id');
        // });

        require base_path('routes/web.php');
        require base_path('routes/api.php');
        require base_path('routes/student.php');
        require base_path('routes/parent.php');
        require base_path('routes/teacher.php');
        require base_path('routes/ajax.php');
        require base_path('routes/admin.php');
    });