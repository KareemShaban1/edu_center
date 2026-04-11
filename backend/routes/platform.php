<?php

use App\Http\Controllers\Platform\Auth\LoginController;
use App\Http\Controllers\Platform\PlatformAdminController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'platform', 'as' => 'platform.'], function () {
    Route::middleware('guest:platform_admin')->group(function () {
        Route::get('login', [LoginController::class, 'showLoginForm'])->name('login');
        Route::post('login', [LoginController::class, 'login']);
    });

    Route::middleware('auth:platform_admin')->group(function () {
        Route::post('logout', [LoginController::class, 'logout'])->name('logout');

        Route::get('/', function () {
            return redirect()->route('platform.dashboard');
        });
        Route::get('/dashboard', function () {
            return view('platform.dashboard');
        })->name('dashboard');

        Route::resource('tenants', 'Platform\PlatformAdminController');
        Route::patch('tenants/{tenant}/toggle-status', [PlatformAdminController::class, 'toggleStatus'])
            ->name('tenants.toggle-status');
    });
});
