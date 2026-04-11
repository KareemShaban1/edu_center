<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepoServiceProvider extends ServiceProvider
{

    public function register()
    {
        $this->app->bind('App\Repository\Admin\TeacherRepositoryInterface', 'App\Repository\Admin\TeacherRepository');
        $this->app->bind('App\Repository\Admin\StudentRepositoryInterface', 'App\Repository\Admin\StudentRepository');
        $this->app->bind('App\Repository\Admin\FeesRepositoryInterface', 'App\Repository\Admin\FeesRepository');
        $this->app->bind('App\Repository\Admin\PaymentRepositoryInterface', 'App\Repository\Admin\PaymentRepository');
        $this->app->bind('App\Repository\Admin\AttendanceRepositoryInterface', 'App\Repository\Admin\AttendanceRepository');
        $this->app->bind('App\Repository\Admin\LibraryRepositoryInterface', 'App\Repository\Admin\LibraryRepository');
        $this->app->bind('App\Repository\Admin\QuizDegreeRepositoryInterface', 'App\Repository\Admin\QuizDegreeRepository');
        $this->app->bind('App\Repository\Admin\ExamDegreeRepositoryInterface', 'App\Repository\Admin\ExamDegreeRepository');
        $this->app->bind('App\Repository\Admin\ClassesRepositoryInterface', 'App\Repository\Admin\ClassesRepository');
        $this->app->bind('App\Repository\Admin\GradeRepositoryInterface', 'App\Repository\Admin\GradeRepository');
        $this->app->bind('App\Repository\Admin\SectionRepositoryInterface', 'App\Repository\Admin\SectionRepository');
        $this->app->bind('App\Repository\Admin\AnnouncementRepositoryInterface', 'App\Repository\Admin\AnnouncementRepository');
        $this->app->bind('App\Repository\Admin\MeetingsRepositoryInterface', 'App\Repository\Admin\MeetingsRepository');
        $this->app->bind('App\Repository\Admin\UnitRepositoryInterface', 'App\Repository\Admin\UnitRepository');
        $this->app->bind('App\Repository\Admin\LessonRepositoryInterface', 'App\Repository\Admin\LessonRepository');
        $this->app->bind('App\Repository\Admin\WordRepositoryInterface', 'App\Repository\Admin\WordRepository');
        $this->app->bind('App\Repository\Admin\ParentRepositoryInterface', 'App\Repository\Admin\ParentRepository');


    }


    public function boot()
    {
        //
    }
}
