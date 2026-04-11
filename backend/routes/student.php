<?php

use App\Http\Controllers\Dashboards\StudentDashboard\HomeworkController;
use App\Http\Controllers\Dashboards\StudentDashboard\StudentDashboardController;
use App\Models\Student;

use Illuminate\Support\Facades\Route;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

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
        'middleware' => ['localeCookieRedirect', 'localizationRedirect', 'localeViewPath', 'auth:student']
    ],
    function () {
        //==============================dashboard============================
        Route::get('/student/dashboard', [StudentDashboardController::class, 'dashboardPage'])
        ->name('dashboard.Students');

        Route::group(['namespace' => 'Dashboards\StudentDashboard'], function () {
            Route::resource('student_profile', 'ProfileController');
            Route::get('student_attendance/{student_id}', 'StudentDashboardController@studentAttendance')->name('student.attendance');
            Route::get('student_payment/{student_id}', 'StudentDashboardController@studentPayment')->name('student.payment');
            Route::get('student_quiz/{student_id}', 'StudentDashboardController@studentQuiz')->name('student.quiz');
            Route::get('student_exam/{student_id}', 'StudentDashboardController@studentExam')->name('student.exam');
            Route::get('student_library/{student_id}', 'LibraryController@studentLibrary')->name('student.library');
            Route::get('student_library/filter/{student_id}', 'LibraryController@filterLibrary')->name('student.library.filter');
            Route::get('student_meetings/{student_id}', 'StudentDashboardController@studentMeetings')->name('student.student_meetings');
            Route::get('student_announcements/{student_id}', 'StudentDashboardController@studentAnnouncements')->name('student.announcements');
            Route::get('student_announcements/filter/{student_id}', 'StudentDashboardController@filterAnnouncements')->name('student.announcements.filter');
            Route::get('download/{filename}', 'StudentDashboardController@download')
            ->name('download')->withoutMiddleware(['localeCookieRedirect']);
            
        });

        Route::get('download_file/{media}', 'LibraryController@download')
        ->name('student.download')->withoutMiddleware(['localeCookieRedirect']);

        

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

        Route::get('student_homework', [HomeworkController::class, 'index'])->name('student.student_homework');
        Route::get('student_homework/view/{id}', [HomeworkController::class, 'view'])->name('student_homework.view');
        Route::post('student_homework/upload/{id}', [HomeworkController::class, 'upload'])->name('student_homework.upload');
        Route::post('student_homework/store', [HomeworkController::class, 'storeStudentHomework'])
        ->name('student_homework.store');


        
    }
);
