<?php

use Illuminate\Support\Facades\Route;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/*
|--------------------------------------------------------------------------
| Ajax Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::group([
    'prefix' => LaravelLocalization::setLocale(),
    'middleware' => ['localeCookieRedirect', 'localizationRedirect', 'localeViewPath', 
    'auth:web,teacher,student,parent']
], function () {
Route::get('/Get_Classes/{id}', 'AjaxController@Get_Classes');
Route::get('/Get_Sections/{class_id}/{grade_id}', 'AjaxController@Get_Sections');
Route::get('/Get_amount/{id}', 'AjaxController@Get_amount');

});

