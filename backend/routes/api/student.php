<?php

use Illuminate\Support\Facades\Route;

Route::get('/student/portal', [App\Http\Controllers\Api\Student\StudentPortalApiController::class, 'portal']);
Route::get('/student/bootstrap', [App\Http\Controllers\Api\Student\StudentBootstrapApiController::class, 'show']);
Route::post('/student/sessions', [App\Http\Controllers\Api\Student\StudentSessionsApiController::class, 'store']);
Route::put('/student/sessions/{id}', [App\Http\Controllers\Api\Student\StudentSessionsApiController::class, 'update']);
Route::delete('/student/sessions/{id}', [App\Http\Controllers\Api\Student\StudentSessionsApiController::class, 'destroy']);
Route::get('/student/sessions/{id}/livekit-token', [App\Http\Controllers\Api\Student\StudentSessionsApiController::class, 'livekitToken']);
Route::post('/student/attendance', [App\Http\Controllers\Api\Student\StudentAttendanceApiController::class, 'store']);
Route::put('/student/attendance/{id}', [App\Http\Controllers\Api\Student\StudentAttendanceApiController::class, 'update']);
Route::delete('/student/attendance/{id}', [App\Http\Controllers\Api\Student\StudentAttendanceApiController::class, 'destroy']);
Route::post('/student/grades', [App\Http\Controllers\Api\Student\StudentGradesApiController::class, 'store']);
Route::put('/student/grades/{source}/{id}', [App\Http\Controllers\Api\Student\StudentGradesApiController::class, 'update']);
Route::delete('/student/grades/{source}/{id}', [App\Http\Controllers\Api\Student\StudentGradesApiController::class, 'destroy']);
Route::post('/student/homework/submissions', [App\Http\Controllers\Api\Student\StudentHomeworkApiController::class, 'submissions']);
Route::post('/student/homework/submissions/{id}', [App\Http\Controllers\Api\Student\StudentHomeworkApiController::class, 'postSubmissions']);
Route::put('/student/homework/submissions/{id}', [App\Http\Controllers\Api\Student\StudentHomeworkApiController::class, 'updateSubmissions']);
Route::delete('/student/homework/submissions/{id}', [App\Http\Controllers\Api\Student\StudentHomeworkApiController::class, 'destroySubmissions']);
Route::post('/student/library', [App\Http\Controllers\Api\Student\StudentLibraryApiController::class, 'store']);
Route::put('/student/library/{id}', [App\Http\Controllers\Api\Student\StudentLibraryApiController::class, 'update']);
Route::delete('/student/library/{id}', [App\Http\Controllers\Api\Student\StudentLibraryApiController::class, 'destroy']);
