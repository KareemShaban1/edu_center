<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Platform\PlatformCenterApiController;
use App\Http\Controllers\Platform\PlatformBrandingApiController;
use App\Http\Controllers\Admin\DashboardApiController;
use App\Http\Controllers\Admin\LandingPageApiController;
use App\Http\Controllers\Api\ConfigApiController;
use App\Http\Controllers\Api\NotificationApiController;
use App\Http\Controllers\Api\CertificationApiController;
use App\Http\Controllers\Api\WhatsAppApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    \App\Http\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \App\Http\Middleware\SyncLegacyCenterSession::class,
    \App\Http\Middleware\RestoreApiSessionFromBearer::class,
])->group(function () {
    Route::get('/config', [ConfigApiController::class, 'show']);
    Route::get('/storage/{path}', [App\Http\Controllers\Api\StorageFileApiController::class, 'show'])
        ->where('path', '.*');
    Route::get('/branding', [PlatformBrandingApiController::class, 'show']);
    Route::get('/ui-translations', [App\Http\Controllers\Api\Platform\UiTranslationApiController::class, 'index']);
    Route::post('/developer/ui-translations', [App\Http\Controllers\Api\Platform\UiTranslationApiController::class, 'store']);
    Route::put('/developer/ui-translations/{key}', [App\Http\Controllers\Api\Platform\UiTranslationApiController::class, 'update'])
        ->where('key', '[A-Za-z0-9_.-]+');
    Route::delete('/developer/ui-translations/{key}', [App\Http\Controllers\Api\Platform\UiTranslationApiController::class, 'destroy'])
        ->where('key', '[A-Za-z0-9_.-]+');
    Route::get('/website-images', [App\Http\Controllers\Api\Platform\WebsiteImageApiController::class, 'index']);
    Route::post('/developer/website-images/{key}', [App\Http\Controllers\Api\Platform\WebsiteImageApiController::class, 'update'])
        ->where('key', '[A-Za-z0-9_.-]+');
    Route::delete('/developer/website-images/{key}', [App\Http\Controllers\Api\Platform\WebsiteImageApiController::class, 'destroy'])
        ->where('key', '[A-Za-z0-9_.-]+');

    Route::get('/personal/todos', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'todos']);
    Route::post('/personal/todos', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'storeTodo']);
    Route::put('/personal/todos/{id}', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'updateTodo'])->whereNumber('id');
    Route::put('/personal/todos/{id}/complete', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'completeTodo'])->whereNumber('id');
    Route::delete('/personal/todos/{id}', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'destroyTodo'])->whereNumber('id');
    Route::get('/personal/notes', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'notes']);
    Route::post('/personal/notes', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'storeNote']);
    Route::put('/personal/notes/{id}', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'updateNote'])->whereNumber('id');
    Route::delete('/personal/notes/{id}', [App\Http\Controllers\Api\PersonalProductivityApiController::class, 'destroyNote'])->whereNumber('id');

    require __DIR__ . '/api/admin.php';
    require __DIR__ . '/api/teacher.php';
    require __DIR__ . '/api/student.php';
    require __DIR__ . '/api/parent.php';
    Route::get('/platform/centers', [PlatformCenterApiController::class, 'index']);
    Route::post('/platform/centers', [PlatformCenterApiController::class, 'store']);
    Route::get('/platform/centers/{id}', [PlatformCenterApiController::class, 'show']);
    Route::put('/platform/centers/{id}', [PlatformCenterApiController::class, 'update']);
    Route::delete('/platform/centers/{id}', [PlatformCenterApiController::class, 'destroy']);
    Route::get('/platform/tenants', [PlatformCenterApiController::class, 'index']);
    Route::post('/platform/tenants', [PlatformCenterApiController::class, 'store']);
    Route::get('/platform/tenants/{id}', [PlatformCenterApiController::class, 'show']);
    Route::put('/platform/tenants/{id}', [PlatformCenterApiController::class, 'update']);
    Route::delete('/platform/tenants/{id}', [PlatformCenterApiController::class, 'destroy']);
    Route::get('/platform/branding', [PlatformBrandingApiController::class, 'show']);
    Route::put('/platform/branding', [PlatformBrandingApiController::class, 'update']);

    require __DIR__ . '/api/platform.php';

    Route::get('/dashboard', [DashboardApiController::class, 'show']);

    Route::get('/notifications/vapid-key', [NotificationApiController::class, 'vapidKey']);
    Route::get('/notifications', [NotificationApiController::class, 'index']);
    Route::post('/notifications/subscribe', [NotificationApiController::class, 'subscribe']);
    Route::post('/notifications/mark-all-read', [NotificationApiController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationApiController::class, 'markRead'])->whereUuid('id');
    Route::get('/admin/notifications', [NotificationApiController::class, 'adminIndex']);
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
    require __DIR__ . '/api/locale.php';

    require __DIR__ . '/api/public.php';
    require __DIR__ . '/api/auth.php';

    Route::get('/admin/landing-pages', [LandingPageApiController::class, 'index']);
    Route::post('/admin/landing-pages', [LandingPageApiController::class, 'store']);
    Route::post('/admin/landing-pages/from-template', [LandingPageApiController::class, 'store']);
    Route::post('/admin/landing-pages/from-teacher', [LandingPageApiController::class, 'fromTeacher']);
    Route::get('/admin/landing-pages/media', [LandingPageApiController::class, 'mediaIndex']);
    Route::post('/admin/landing-pages/media', [LandingPageApiController::class, 'mediaStore']);
    Route::delete('/admin/landing-pages/media/{id}', [LandingPageApiController::class, 'mediaDestroy']);
    Route::get('/admin/landing-pages/{id}', [LandingPageApiController::class, 'show'])->whereNumber('id');
    Route::put('/admin/landing-pages/{id}', [LandingPageApiController::class, 'update'])->whereNumber('id');
    Route::delete('/admin/landing-pages/{id}', [LandingPageApiController::class, 'destroy'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/publish', [LandingPageApiController::class, 'publish'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/unpublish', [LandingPageApiController::class, 'unpublish'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/duplicate', [LandingPageApiController::class, 'duplicate'])->whereNumber('id');
    Route::get('/admin/landing-pages/{pageId}/revisions', [LandingPageApiController::class, 'revisions'])->whereNumber('pageId');
    Route::post('/admin/landing-pages/{pageId}/revisions/{revisionId}/restore', [LandingPageApiController::class, 'restoreRevision'])->whereNumber(['pageId', 'revisionId']);
    Route::get('/admin/landing-pages/{pageId}/analytics', [LandingPageApiController::class, 'analytics'])->whereNumber('pageId');
    Route::get('/public/landing/{slug}', [LandingPageApiController::class, 'publicShow'])->where('slug', '.+');
});