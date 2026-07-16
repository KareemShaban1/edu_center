<?php

use Illuminate\Support\Facades\Route;

Route::get('/public/centers', [App\Http\Controllers\Api\Public\PublicApiController::class, 'centers']);
Route::get('/public/centers/{slug}/academic', [App\Http\Controllers\Api\Public\PublicApiController::class, 'centerAcademic'])
    ->where('slug', '[A-Za-z0-9_-]+');
Route::get('/public/stats', [App\Http\Controllers\Api\Public\PublicApiController::class, 'stats']);
