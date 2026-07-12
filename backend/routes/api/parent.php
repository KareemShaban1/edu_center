<?php

use Illuminate\Support\Facades\Route;

Route::get('/parent/portal', [App\Http\Controllers\Api\Parent\ParentPortalApiController::class, 'portal']);
Route::get('/parent/bootstrap', [App\Http\Controllers\Api\Parent\ParentBootstrapApiController::class, 'show']);
