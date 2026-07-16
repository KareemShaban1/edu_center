<?php

use Illuminate\Support\Facades\Route;

Route::get('/platform/subscriptions', [App\Http\Controllers\Api\Platform\PlatformSubscriptionsApiController::class, 'index']);
Route::post('/platform/subscriptions', [App\Http\Controllers\Api\Platform\PlatformSubscriptionsApiController::class, 'store']);
Route::put('/platform/subscriptions/{id}', [App\Http\Controllers\Api\Platform\PlatformSubscriptionsApiController::class, 'update']);
Route::delete('/platform/subscriptions/{id}', [App\Http\Controllers\Api\Platform\PlatformSubscriptionsApiController::class, 'destroy']);
Route::get('/platform/users', [App\Http\Controllers\Api\Platform\PlatformUsersApiController::class, 'index']);
Route::post('/platform/users', [App\Http\Controllers\Api\Platform\PlatformUsersApiController::class, 'store']);
Route::put('/platform/users/{id}', [App\Http\Controllers\Api\Platform\PlatformUsersApiController::class, 'update']);
Route::delete('/platform/users/{id}', [App\Http\Controllers\Api\Platform\PlatformUsersApiController::class, 'destroy']);
Route::get('/platform/students', [App\Http\Controllers\Api\Platform\PlatformStudentsApiController::class, 'index']);
Route::get('/platform/students/{id}', [App\Http\Controllers\Api\Platform\PlatformStudentsApiController::class, 'show'])->whereNumber('id');
Route::get('/platform/parents', [App\Http\Controllers\Api\Platform\PlatformParentsApiController::class, 'index']);
Route::get('/platform/parents/{id}', [App\Http\Controllers\Api\Platform\PlatformParentsApiController::class, 'show'])->whereNumber('id');
Route::get('/platform/roles', [App\Http\Controllers\Api\Platform\PlatformRolesApiController::class, 'index']);
Route::get('/platform/activity-logs', [App\Http\Controllers\Api\Platform\PlatformActivityLogsApiController::class, 'index']);
