<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NotificationApiController;
use App\Http\Controllers\Api\WhatsAppApiController;
use App\Http\Controllers\Api\CertificationApiController;

Route::prefix('{locale}')->where(['locale' => 'en|ar'])->group(function () {
    Route::get('/notifications/vapid-key', [NotificationApiController::class, 'vapidKey']);
    Route::get('/notifications', [NotificationApiController::class, 'index']);
    Route::post('/notifications/subscribe', [NotificationApiController::class, 'subscribe']);
    Route::post('/notifications/mark-all-read', [NotificationApiController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationApiController::class, 'markRead'])->whereUuid('id');
    Route::post('/admin/notifications/send', [NotificationApiController::class, 'adminSend']);

    Route::get('/admin/whatsapp/templates', [WhatsAppApiController::class, 'listTemplates']);
    Route::post('/admin/whatsapp/templates', [WhatsAppApiController::class, 'createTemplate']);
    Route::put('/admin/whatsapp/templates/{id}', [WhatsAppApiController::class, 'updateTemplate'])->whereNumber('id');
    Route::delete('/admin/whatsapp/templates/{id}', [WhatsAppApiController::class, 'deleteTemplate'])->whereNumber('id');
    Route::post('/admin/whatsapp/prepare', [WhatsAppApiController::class, 'prepareSend']);
    Route::post('/admin/whatsapp/send', [WhatsAppApiController::class, 'send']);
    Route::get('/admin/whatsapp/status', [WhatsAppApiController::class, 'status']);

    Route::get('/admin/certifications/templates', [CertificationApiController::class, 'listTemplates']);
    Route::post('/admin/certifications/templates', [CertificationApiController::class, 'createTemplate']);
    Route::put('/admin/certifications/templates/{id}', [CertificationApiController::class, 'updateTemplate'])->whereNumber('id');
    Route::delete('/admin/certifications/templates/{id}', [CertificationApiController::class, 'deleteTemplate'])->whereNumber('id');
    Route::get('/admin/certifications/issued', [CertificationApiController::class, 'listIssued']);
    Route::post('/admin/certifications/prepare', [CertificationApiController::class, 'prepareIssue']);
    Route::post('/admin/certifications/issue', [CertificationApiController::class, 'issue']);
    Route::delete('/admin/certifications/issued/{id}', [CertificationApiController::class, 'deleteIssued'])->whereNumber('id');
});
