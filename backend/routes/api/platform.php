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
Route::get('/platform/governorates', [App\Http\Controllers\Api\Platform\PlatformGovernoratesApiController::class, 'index']);
Route::post('/platform/governorates', [App\Http\Controllers\Api\Platform\PlatformGovernoratesApiController::class, 'store']);
Route::put('/platform/governorates/{id}', [App\Http\Controllers\Api\Platform\PlatformGovernoratesApiController::class, 'update']);
Route::delete('/platform/governorates/{id}', [App\Http\Controllers\Api\Platform\PlatformGovernoratesApiController::class, 'destroy']);
Route::get('/platform/cities', [App\Http\Controllers\Api\Platform\PlatformCitiesApiController::class, 'index']);
Route::post('/platform/cities', [App\Http\Controllers\Api\Platform\PlatformCitiesApiController::class, 'store']);
Route::put('/platform/cities/{id}', [App\Http\Controllers\Api\Platform\PlatformCitiesApiController::class, 'update']);
Route::delete('/platform/cities/{id}', [App\Http\Controllers\Api\Platform\PlatformCitiesApiController::class, 'destroy']);
Route::get('/platform/areas', [App\Http\Controllers\Api\Platform\PlatformAreasApiController::class, 'index']);
Route::post('/platform/areas', [App\Http\Controllers\Api\Platform\PlatformAreasApiController::class, 'store']);
Route::put('/platform/areas/{id}', [App\Http\Controllers\Api\Platform\PlatformAreasApiController::class, 'update']);
Route::delete('/platform/areas/{id}', [App\Http\Controllers\Api\Platform\PlatformAreasApiController::class, 'destroy']);
