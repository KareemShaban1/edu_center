<?php

use App\Http\Controllers\Dashboards\AdminDashboard\CertificationTemplateController;
use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;
use Mcamara\LaravelLocalization\Facades\LaravelLocalization;
use App\Http\Controllers\Dashboards\AdminDashboard\ProfileController;
use App\Http\Controllers\Dashboards\AdminDashboard\WhatsappTemplateController;

//==============================Translate all pages============================
Route::group(
    [
        'namespace' => 'Dashboards\AdminDashboard',
        'prefix' => LaravelLocalization::setLocale(),
        'middleware' => [
            'localeCookieRedirect',
            'localizationRedirect',
            'localeViewPath',
            'auth:web'
        ]
    ],
    function () {

        //==============================dashboard============================
        Route::get('/dashboard', 'HomeController@dashboard')->name('dashboard');
        Route::get('/calendar', 'HomeController@calendar');

        Route::get('profile/admin', [ProfileController::class, 'index'])->name('profile.show.admin');
        Route::Put('profile/admin/{id}', [ProfileController::class, 'update'])->name('admin_profile.update');


        //==============================Grades============================
        Route::group([], function () {
            Route::resource('grades', 'GradeController');
        });

        //==============================Classrooms============================
        Route::group([], function () {
            Route::resource('classes', 'ClassesController');
            Route::get('/classes-notes/{id}', 'ClassesController@notes')->name('classes.notes');
            Route::get('/classes-questions/{id}', 'ClassesController@classQuestions')
                ->name('classes.classQuestions');
            Route::get('/classes-print-questions/{id}', 'ClassesController@printQuestions')
                ->name('classes.printQuestions');
            Route::get('/classes-question-model/{id}', 'ClassesController@questionModel')
                ->name('classes.questionModel');
            Route::get('/classes-units-lessons/{id}', 'ClassesController@classUnitsLessons')
                ->name('classes.classUnitsLessons');
            Route::get('/classes-lesson-questions/{id}', 'ClassesController@lessonQuestions')
                ->name('classes.lessonQuestions');
            Route::post('delete_all', 'ClassesController@delete_all')->name('delete_all');
            Route::post('Filter_Classes', 'ClassesController@Filter_Classes')->name('Filter_Classes');
        });


        //==============================Sections============================
        Route::group([], function () {
            Route::resource('sections', 'SectionController')->except(['show']);
            Route::get('details/{id}', 'SectionController@details')
                ->name('sections.details');
            Route::get('sections_notes/{id}', 'SectionController@notes')
                ->name('sections.notes');

            Route::get('/classes/{id}', 'SectionController@getclasses');

            Route::get('/sections/{id}', 'SectionController@getsections');
        });

        //==============================parents============================
        // Route::view('add_parent', 'dashboards.admin.livewire.show_Form')->name('add_parent');


        //==============================Teachers============================
        Route::group([], function () {
            Route::resource('teachers', 'TeacherController');
        });


        //==============================Students============================
        Route::group([], function () {

            Route::get('students/data', 'StudentController@data')->name('students.data');
            Route::post('students/import', 'StudentController@import')->name('students.import');
            Route::get('students/importPage', 'StudentController@importPage')->name('students.importPage');
            Route::resource('students', 'StudentController');


            Route::post('Upload_attachment/{studentId}', 'StudentController@Upload_attachment')->name('Upload_attachment');
            Route::delete('students/delete-file/{id}', 'StudentController@@deleteFile')->name('students.delete_file');

            Route::get('Download_attachment/{studentsname}/{filename}', 'StudentController@Download_attachment')->name('Download_attachment')->withoutMiddleware(['localeCookieRedirect']);
            Route::post('Delete_attachment', 'StudentController@Delete_attachment')->name('Delete_attachment');

            Route::get('parents/data', 'ParentController@data')->name('parents.data');
            Route::post('parents/import', 'ParentController@import')->name('parents.import');
            Route::get('parents/importPage', 'ParentController@importPage')->name('parents.importPage');
            Route::resource('parents', 'ParentController');



            Route::resource('meetings', 'MeetingsController');

            Route::get('indirect_admin', 'MeetingsController@indirectCreate')->name('indirect.create.admin');
            Route::post('indirect_admin', 'MeetingsController@storeIndirect')->name('indirect.store.admin');

            Route::resource('fees', 'FeesController');

            // Route::resource('Payment', 'PaymentController');
            Route::get('payment_show_groups', 'PaymentController@showGroups')->name('Payment.showGroups');
            Route::get('choose_payment_month/{section_id}/', 'PaymentController@choosePaymentMonth')->name('payment.choosePaymentMonth');
            Route::get('add_edit_payment/{section_id}/{fee_id}', 'PaymentController@addEditPayment')->name('payment.addEditPayment');
            Route::post('store_update_payment', 'PaymentController@storeUpdatePayment')->name('payment.storeUpdatePayment');
            Route::get('filter/{id}', 'PaymentController@filter')->name('payment.filter');

            Route::get('attendance/show_groups', 'AttendanceController@show_groups')->name('attendance.show_groups');
            Route::get('choose_attendance_day/{section_id}', 'AttendanceController@choose_attendance_day')->name('attendance.choose_attendance_day');
            Route::get('show_attendance/{section_id}/{date}/', 'AttendanceController@show_attendance')->name('attendance.show_attendance');
            Route::resource('attendance', 'AttendanceController');
            Route::get('student_attendance_report/{student_id}', 'AttendanceController@student_attendance')
                ->name('attendance.student_attendance_report');

            Route::get('attendance_send_notification/{student_id}', 'AttendanceController@sendNotifications')
                ->name('attendance.sendNotification');


            Route::get('attendance_send_whatsapp/{student_id}', 'AttendanceController@sendWhatsappMessage')
                ->name('attendance.sendWhatsappMessage');
            // sendWhatsappMessage

            Route::get('show_attendance_degree/{section_id}/{date}/', 'AttendanceController@show_attendance_degree')
                ->name('attendance.show_attendance_degree');


            Route::get('download_file/{media}', 'LibraryController@downloadAttachment')->name('downloadAttachment')->withoutMiddleware(['localeCookieRedirect']);
            Route::resource('library', 'LibraryController')->except(['show']);
        });


        //============================== quiz ============================
        Route::group([], function () {
            Route::resource('quiz-degree', 'QuizDegreeController');
            Route::get('quiz_show_groups', 'QuizDegreeController@showGroups')->name('QuizDegree.showGroups');
            Route::get('choose_quiz_day/{section_id}', 'QuizDegreeController@choose_quiz_day')->name('QuizDegree.choose_quiz_day');
            Route::get('show_quiz_degree/{section_id}/{day}/', 'QuizDegreeController@show_quiz_degree')->name('QuizDegree.show_quiz_degree');
            Route::post('store_update_quiz_degree/', 'QuizDegreeController@store_update_quiz_degree')->name('QuizDegree.store_update_quiz_degree');
            Route::get('quiz_send_notification/{student_id}', 'QuizDegreeController@sendNotifications')
                ->name('QuizDegree.sendNotification');


            Route::get('quiz_send_whatsapp/{student_id}', 'QuizDegreeController@sendWhatsappMessage')
                ->name('QuizDegree.sendWhatsappMessage');
        });

        //============================== Exams ============================
        Route::group([], function () {
            Route::resource('exam-degree', 'ExamDegreeController');
            Route::get('exam_show_groups', 'ExamDegreeController@showGroups')->name('ExamDegree.showGroups');
            Route::get('choose_exam_day/{section_id}', 'ExamDegreeController@choose_exam_day')->name('ExamDegree.choose_exam_day');
            Route::get('show_exam_degree/{section_id}/{date}/', 'ExamDegreeController@show_exam_degree')->name('ExamDegree.show_exam_degree');
            Route::post('storeUpdateExamDegree/', 'ExamDegreeController@storeUpdateExamDegree')->name('ExamDegree.storeUpdateExamDegree');

            Route::get('exam_send_notification/{student_id}', 'ExamDegreeController@sendNotifications')
                ->name('ExamDegree.sendNotification');


            Route::get('exam_send_whatsapp/{student_id}', 'ExamDegreeController@sendWhatsappMessage')
                ->name('ExamDegree.sendWhatsappMessage');
        });


        Route::resource('announcements', 'AnnouncementsController');




        //==============================Setting============================
        Route::resource('settings', 'SettingController');
        Route::get('settings/', 'SettingController@index')->name('settings.index');
        Route::put('update_settings/', 'SettingController@update')->name('settings.update');

        //==============================Months============================
        Route::group([], function () {
            Route::get('add/', 'MonthsController@add')->name('months.add');
            Route::post('store/', 'MonthsController@store')->name('months.store');
        });

        Route::resource('notes', 'NotesController');

        //==============================Questions============================
        Route::resource('questions', 'QuestionController');
        Route::delete('delete_questions/{id}', 'QuestionController@destroy')->name('questions.delete');
        Route::post('store_update_questions_from_class', 'QuestionController@storeOrUpdateFromClass')->name('questions.storeOrUpdateFromClass');
        Route::post('store_update_questions_from_lesson', 'QuestionController@storeOrUpdateFromLesson')->name('questions.storeOrUpdateFromLesson');

        //==============================Units============================
        Route::resource('units', 'UnitController');
        Route::get('units/{id}', 'UnitController@details')->name('units.details');

        //==============================Lessons============================
        Route::resource('lessons', 'LessonController');
        Route::get('lessons/{id}', 'LessonController@details')->name('lessons.details');
        Route::get('lessons/words_model/{id}', 'LessonController@wordsModel')
            ->name('lessons.wordsModel');


        //==============================Words============================
        Route::resource('words', 'WordController');
        Route::get('words/{id}', 'WordController@details')->name('words.details');
        Route::post('words/store_multiple', 'WordController@storeMultiple')->name('words.storeMultiple');

        Route::get('section_fees/{section_id}', 'ReportController@sectionFees')->name('report.sectionFees');
    

        Route::get('whatsapp_templates/list_json', 'WhatsappTemplateController@listJson')->name('whatsapp_templates.list_json');
        Route::resource('whatsapp_templates', WhatsappTemplateController::class);

        Route::resource('certifications', CertificationTemplateController::class);
        Route::post('/certifications/{id}/generate-pdf', [CertificationTemplateController::class, 'generatePdf'])->name('certifications.generatePdf');



        Route::resource('homework', 'HomeworkController')->except(['edit','create']);
        Route::get('homeworks/show_groups', 'HomeworkController@showGroups')->name('homework.showGroups');
        Route::get('choose_homework_day/{section_id}', 'HomeworkController@choose_homework_day')->name('homework.choose_homework_day');
        Route::get('show_homework_degree/{section_id}/{date}/', 'HomeworkController@show_homework_degree')->name('homework.show_homework_degree');
        Route::post('storeUpdateHomeworkDegree/', 'HomeworkController@storeUpdateHomeworkDegree')->name('homework.storeUpdateHomeworkDegree');
        Route::get('homework_send_notification/{student_id}', 'HomeworkController@sendNotifications')
            ->name('homework.sendNotification');
        Route::get('homework_send_whatsapp/{student_id}', 'HomeworkController@sendWhatsappMessage')
            ->name('homework.sendWhatsappMessage');
        Route::post('storeUpdateHomeworkDegree/', 'HomeworkController@storeUpdateHomeworkDegree')->name('homework.storeUpdateHomeworkDegree');
    
        
        Route::get('users/data', 'UserController@data')->name('users.data');
        Route::resource('users', 'UserController');

        Route::get('activity-logs/data', 'ActivityLogController@data')->name('activity-logs.data');
        Route::resource('activity-logs', 'ActivityLogController');

        Route::get('roles/data', 'RoleController@data')->name('roles.data');
        Route::resource('roles', 'RoleController');

    
    }
);



Route::get('/rooms', [RoomController::class, 'index'])->name('rooms.index');
Route::get('/rooms/create', [RoomController::class, 'create'])->name('rooms.create');
Route::post('/rooms', [RoomController::class, 'store'])->name('rooms.store');
Route::get('/rooms/{name}', [RoomController::class, 'show'])->name('rooms.show');
