<?php

use Illuminate\Support\Facades\Route;

Route::get('/public/centers', [App\Http\Controllers\Api\Public\PublicApiController::class, 'centers']);
Route::get('/public/stats', [App\Http\Controllers\Api\Public\PublicApiController::class, 'stats']);
