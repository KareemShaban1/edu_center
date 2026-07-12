<?php

use Illuminate\Support\Facades\Route;

Route::get('/auth/guards', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'guards']);
Route::post('/login', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'login']);
Route::post('/register/parent', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'registerParent']);
Route::post('/register/student', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'registerStudent']);
Route::get('/auth/memberships', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'memberships']);
Route::post('/auth/switch-tenant', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'switchCenter']);
Route::post('/auth/switch-center', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'switchCenter']);
Route::post('/logout', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'logout']);
Route::get('/user', [App\Http\Controllers\Api\Auth\AuthApiController::class, 'user']);
