@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/sections_trans.Section_Details') }}
@stop
@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/sections_trans.Section_Details') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <div class="row mb-30">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="card-body">
                                <div class="row">
                                   
                                    <div class="col-md-6">
                                        <h4>{{ trans('admin/sections_trans.Section_Name') }} : {{ $section->section_name }}</h4>
                                        <p> {{ trans('admin/sections_trans.Grade_Name') }} : {{ $section->grade->grade_name }}</p>
                                        <p> {{ trans('admin/sections_trans.Class_Name') }} : {{ $section->class->class_name }}</p>
                                        <p> {{ trans('admin/sections_trans.Teacher_Name') }} : {{ $section->teacher?->name }}</p>
                                        <p> {{ trans('admin/sections_trans.Number_of_Students') }} : {{ $section->students->count() }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ul class="nav nav-tabs" id="mainTabs" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" id="attendance-tab" data-toggle="tab" href="#attendance" role="tab">
                            {{ trans('admin/attendance_trans.Attendance') }}
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="exams-tab" data-toggle="tab" href="#exams" role="tab">
                            {{ trans('admin/exams_trans.Exams') }}
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="quizzes-tab" data-toggle="tab" href="#quizzes" role="tab">
                            {{ trans('admin/quiz_trans.Quizzes') }}
                        </a>
                    </li>
                </ul>
                <div class="tab-content" id="mainTabsContent">
                    <div class="tab-pane fade show active" id="attendance" role="tabpanel">

                        <div class="card">
                            <div class="card-body">
                                @forelse ($section->attendance->unique('attendance_date') as $attendance)
                                <a href="{{ Route('attendance.show_attendance_degree', [$attendance->section_id, $attendance->attendance_date]) }}"
                                    class="btn btn-success btn-sm" role="button" aria-pressed="true">
                                    {{ $attendance->attendance_date }}
                                </a>
                                @empty
                                <div style="text-align: center; font-size:30px">
                                    {{ trans('admin/attendance_trans.No_Attendance_Exist') }}
                                </div>
                                <div style="display: flex; justify-content: center;" class="col-md-12 col-12">
                                    <img src="{{ asset('images/icons/not_found.webp') }}" height="300" width="300"
                                        alt="">
                                </div>
                                @endforelse
                            </div>
                        </div>

                    </div>
                    <div class="tab-pane fade" id="exams" role="tabpanel">
                        <div class="card">
                            <div class="card-body">
                                @forelse ($section->exams->unique('exam_date') as $exam)
                                <a href="{{ Route('Exam.show_exam_degree', [$exam->section_id, $exam->exam_date]) }}"
                                    class="btn btn-success btn-sm" role="button" aria-pressed="true">

                                    {{ $exam->exam_date }}
                                </a>
                                @empty
                                <div class="col-md-12 col-12">
                                    <div style="text-align: center; font-size:30px">
                                        {{ trans('admin/exams_trans.No_Exams_Exist') }}

                                    </div>
                                    <div style="display: flex; justify-content: center;" class="col-12 col-md-12">
                                        <img src="{{ asset('images/icons/not_found.webp') }}" height="300" width="300" alt="">
                                    </div>
                                </div>
                                @endforelse
                            </div>
                        </div>

                    </div>
                    <div class="tab-pane fade" id="quizzes" role="tabpanel">

                        <div class="card">
                            <div class="card-body">
                                @forelse ($section->quizzes->unique('quiz_date') as $quiz)
                                <a href="{{ Route('Quiz.show_quiz_degree', [$quiz->section_id, $quiz->quiz_date]) }}"
                                    class="btn btn-success btn-sm" role="button" aria-pressed="true">
                                    {{ $quiz->quiz_date }}
                                </a>
                                @empty
                                <div style="text-align: center; font-size:30px">
                                    {{ trans('admin/quiz_trans.No_Quizzez_Exist') }}
                                </div>
                                <div style="display: flex; justify-content: center;" class="col-md-12 col-12">
                                    <img src="{{ asset('images/icons/not_found.webp') }}" height="300" width="300"
                                        alt="">
                                </div>
                                @endforelse
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection

@push('scripts')
@endpush