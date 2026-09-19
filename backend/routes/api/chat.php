<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ChatApiController;
use Illuminate\Support\Facades\Route;

Route::get('/chat/contacts', [ChatApiController::class, 'contacts']);
Route::get('/chat/conversations', [ChatApiController::class, 'conversations']);
Route::post('/chat/conversations', [ChatApiController::class, 'storeConversation']);
Route::get('/chat/unread', [ChatApiController::class, 'unread']);
Route::get('/chat/stream', [ChatApiController::class, 'stream']);
Route::get('/chat/conversations/{id}', [ChatApiController::class, 'showConversation'])->whereNumber('id');
Route::get('/chat/conversations/{id}/messages', [ChatApiController::class, 'messages'])->whereNumber('id');
Route::post('/chat/conversations/{id}/messages', [ChatApiController::class, 'storeMessage'])->whereNumber('id');
Route::post('/chat/conversations/{id}/read', [ChatApiController::class, 'markRead'])->whereNumber('id');
Route::post('/chat/conversations/{id}/typing', [ChatApiController::class, 'typing'])->whereNumber('id');
Route::get('/chat/conversations/{id}/attachment/{mediaId}', [ChatApiController::class, 'attachment'])
    ->whereNumber('id')
    ->whereNumber('mediaId');
