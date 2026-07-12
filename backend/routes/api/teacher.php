<?php

use Illuminate\Support\Facades\Route;

Route::get('/teacher/bootstrap', [App\Http\Controllers\Api\Teacher\TeacherBootstrapApiController::class, 'show']);
Route::get('/teacher/sessions/{id}/livekit-token', [App\Http\Controllers\Api\Teacher\TeacherSessionsApiController::class, 'livekitToken']);
Route::get('/teacher/sessions', [App\Http\Controllers\Api\Teacher\TeacherSessionsApiController::class, 'index']);
Route::put('/teacher/sessions/{id}', [App\Http\Controllers\Api\Teacher\TeacherSessionsApiController::class, 'update']);
Route::delete('/teacher/sessions/{id}', [App\Http\Controllers\Api\Teacher\TeacherSessionsApiController::class, 'destroy']);
