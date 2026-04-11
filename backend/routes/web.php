<?php

use Illuminate\Support\Facades\Route;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

//Auth::routes();

Route::get('/', function () {
    return view('frontend.home');
});

Route::get('/selection', 'Dashboards\AdminDashboard\HomeController@index')->name('selection');
// Route::get('/', 'App\Http\Controllers\Frontend\HomeController@index')->name('home');

Route::group(['namespace' => 'Auth'], function () {
    Route::get('/login/{type}', 'LoginController@loginForm')->name('login.show');
    Route::post('/login', 'LoginController@login')->name('login');
    Route::get('/logout/{type}', 'LoginController@logout')->name('logout');
});



require __DIR__ . '/admin.php';

require __DIR__ . '/teacher.php';

require __DIR__ . '/platform.php';

Route::fallback(function () {
    return response()->view('errors.404', [], 404);
});


