<?php

use App\Http\Controllers\Dashboards\ParentsDashboard\ParentDashboardController;
use App\Models\Student;
use Illuminate\Support\Facades\Route;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;
use App\Http\Middleware\InitializeCenterFromSubdomain;

/*
|--------------------------------------------------------------------------
| student Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

//==============================Translate all pages============================
Route::group(
    [
        'prefix' => LaravelLocalization::setLocale(),
        'middleware' => [
            'localeCookieRedirect',
            'localizationRedirect',
            'localeViewPath',
            'auth:parent',
            InitializeCenterFromSubdomain::class,
        ]
    ],
    function () {


        Route::get('/vapid-key', [App\Http\Controllers\NotificationController::class, 'getVapidKey']);
        Route::post('/subscribe', [App\Http\Controllers\NotificationController::class, 'subscribe']);

        //==============================dashboard============================
        Route::get('/parent/dashboard', [ParentDashboardController::class, 'dashboardPage'])->name('dashboard.parents');

        Route::group(['namespace' => 'Dashboards\ParentsDashboard'], function () {

            Route::get('children', 'ParentDashboardController@index')->name('sons.index');

            Route::get('son_attendance/{id}', 'ParentDashboardController@studentAttendance')->name('sons.student_attendance');
            Route::get('son_payment/{id}', 'ParentDashboardController@studentPayment')->name('sons.student_payment');
            Route::get('son_quiz/{id}', 'ParentDashboardController@studentQuiz')->name('sons.student_quiz');
            Route::get('son_exam/{id}', 'ParentDashboardController@studentExam')->name('sons.student_exam');
            Route::get('attendances', 'ParentDashboardController@attendances')->name('sons.attendances');
            Route::post('attendances', 'ParentDashboardController@attendanceSearch')->name('sons.attendance.search');

            Route::get('attendance_report', 'ParentDashboardController@sonsAttendance')->name('sons.attendance_report');
            Route::get('exam_report', 'ParentDashboardController@sonsExam')->name('sons.exam_report');
            Route::get('quiz_report', 'ParentDashboardController@sonsQuiz')->name('sons.quiz_report');
            Route::get('payment_report', 'ParentDashboardController@sonsPayment')->name('sons.payment_report');

            Route::get('profile/parent', 'ParentDashboardController@profile')->name('profile.show.parent');
            Route::post('profile/parent/{id}', 'ParentDashboardController@updateProfile')->name('profile.update.parent');


            Route::get('/notifications', function () {
                $notifications = auth()->user()->notifications()->latest()->paginate(10);

                return response()->json([
                    'notifications' => $notifications->map(function ($n) {
                        return [
                            'id' => $n->id,
                            'data' => $n->data,
                            'read_at' => $n->read_at,
                            'created_at_human' => $n->created_at->diffForHumans(),
                        ];
                    }),
                    'hasMore' => $notifications->hasMorePages(),
                ]);
            });

            Route::post('/notifications/{id}/read', function ($id) {
                $user = auth()->user();
                $notification = $user->notifications()->findOrFail($id);
                $notification->markAsRead();

                return response()->json([
                    'success' => true,
                    'unread_count' => auth()->user()->unreadNotifications()->count(),
                ]);
            });


            Route::post('/notifications/mark-all-read', function () {
                auth()->user()->unreadNotifications->markAsRead();
                return response()->noContent();
            });
        });
    }
);
