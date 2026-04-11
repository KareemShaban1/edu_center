<?php

use App\Http\Controllers\Dashboards\TeacherDashboard\StudentController;
use App\Http\Controllers\Dashboards\TeacherDashboard\TeacherProfileController;
use App\Http\Controllers\Dashboards\TeacherDashboard\StudentsAttendanceController;
use App\Http\Controllers\Dashboards\TeacherDashboard\TeacherDashboardController;
use Illuminate\Support\Facades\Route;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

/*
|--------------------------------------------------------------------------
| teacher Routes
|--------------------------------------------------------------------------
*/

//==============================Translate all pages============================
Route::group(
    [
        'prefix' => LaravelLocalization::setLocale() . '/teacher',
        'middleware' => ['localeCookieRedirect', 'localizationRedirect', 'localeViewPath', 'auth:teacher']
    ],
    function () {
        Route::group(['namespace' => 'Dashboards\TeacherDashboard'], function () {

            // teacher dashboard and student reports
            Route::group([
                'controller'=>'TeacherDashboardController'
            ], function () {
                Route::get('/dashboard', 'index')->name('teacher_dashboard.index');
                Route::get('teacher_groups','TeacherGroups')->name('teacher_dashboard.TeacherGroups');
                Route::get('attendance_report', 'attendanceReport')->name('teacher_dashboard.attendanceReport');
                Route::get('exam_report', 'examReport')->name('teacher_dashboard.examReport');
                Route::get('quiz_report', 'quizReport')->name('teacher_dashboard.quizReport');
                Route::get('payment_report', 'paymentReport')->name('teacher_dashboard.paymentReport');
            });
            


            // students Attendance
            Route::group([
                'controller'=>'StudentsAttendanceController'
            ], function () {

                Route::get('show_groups', 'showGroups')->name('teacher_dashboard.showGroups');
                Route::get('show_attendance/{section_id}', 'showAttendance')->name('teacher_dashboard.attendanceShow');
                Route::post('store_attendance', 'storeAttendance')->name('teacher_dashboard.attendanceStore');
                Route::get('attendance_search', 'attendanceSearchView')->name('teacher_dashboard.attendanceSearchView');
                Route::post('attendance_search', 'attendanceSearch')->name('teacher_dashboard.attendanceSearch');

            });

            Route::get('meetings/{id}/livekit-token', 'MeetingsController@livekitToken')->name('teacher_meetings.livekit_token');
            Route::get('meetings/create/{group_id}', 'MeetingsController@create')->name('teacher_meetings.create');
            Route::resource('meetings', 'MeetingsController')->except(['create', 'show', 'edit', 'update'])->names([
                'index' => 'teacher_meetings.index',
                'store' => 'teacher_meetings.store',
                'destroy' => 'teacher_meetings.destroy',
            ]);
            Route::get('meetings_groups', 'MeetingsController@showGroups')->name('teacher_meetings.show_groups');
            Route::get('/meetings/indirect/create', 'MeetingsController@indirectCreate')->name('indirect.teacher.create');
            Route::post('/meetings/indirect', 'MeetingsController@storeIndirect')->name('indirect.teacher.store');

            // Weekly series (template) for recurring sessions.
            Route::get('meeting_series', 'MeetingSeriesController@index')->name('teacher_meeting_series.index');
            Route::get('meeting_series_groups', 'MeetingSeriesController@showGroups')->name('teacher_meeting_series.show_groups');
            Route::get('meeting_series/create/{group_id}', 'MeetingSeriesController@create')->name('teacher_meeting_series.create');
            Route::post('meeting_series', 'MeetingSeriesController@store')->name('teacher_meeting_series.store');
            Route::delete('meeting_series/{id}', 'MeetingSeriesController@destroy')->name('teacher_meeting_series.destroy');


            // teacher profile
            Route::get('profile', [TeacherProfileController::class,'index'])->name('profile.show.teacher');
            Route::post('profile/{id}', [TeacherProfileController::class,'update'])->name('profile.update');
        });
    }
);
