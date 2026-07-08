<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\App;
use App\Models\Student;
use App\Observers\GenericObserver;
use Illuminate\Support\Facades\Auth;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {

    }
    

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
        

        App::setlocale('ar');

        Schema::defaultStringLength(191);

        view()->composer('layouts.main-sidebar.student-main-sidebar', function ($view) {
            $student = Student::findOrFail(Auth::user()->id);
            $view->with('student', $student);
        });

        //
        $models = [
            'App\Models\User',
            'App\Models\Announcement',
            'App\Models\Grade',
            'App\Models\Classes',
            'App\Models\Section',
            'App\Models\Student',
            'App\Models\Teacher',
            'App\Models\Parents',
            'App\Models\Fee',
            'App\Models\Payment',
            'App\Models\Attendance',
            'App\Models\CertificationTemplate',
            'App\Models\StudentCertification',
            'App\Models\WhatsappTemplate',
            'App\Models\Homework',
            'App\Models\ExamDegree',
            'App\Models\QuizDegree',
            'App\Models\Lesson',
            'App\Models\Unit',
            'App\Models\Question',
            'App\Models\Answer',
            'App\Models\Library',
            'App\Models\Word',
            'App\Models\Note',
            'App\Models\Fee',
            'App\Models\Setting',
            'Spatie\Permission\Models\Role',
            'Spatie\Permission\Models\Permission'
        ];
        foreach ($models as $model) {
            $model::observe(GenericObserver::class);
        }
    }
}
