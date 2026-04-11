@extends('layouts.master')
@section('css')
@section('title')
    الملف الشخصي
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
<h4 class="mb-0" style="font-family: 'Cairo', sans-serif">
    مرحبا بك :
    {{ Auth::user()->father_name }}
</h4> <!-- breadcrumb -->
@endsection
@section('content')

<div class="row mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <form id="studentFilterForm" action="{{ route('dashboard.parents') }}" method="GET">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <select class="custom-select" name="student_id" id="student_filter"
                                onchange="this.form.submit()">
                                <option value="">{{ trans('Parents_Dashboard/attendance_trans.Choose_Student') }}
                                </option>
                                @foreach ($sons as $son)
                                    <option value="{{ $son->id }}"
                                        {{ request('student_id', isset($data['student']) ? $data['student']->id : '') == $son->id ? 'selected' : '' }}>
                                        {{ $son->name }} - {{ $son->grade->grade_name }} /
                                        {{ $son->class->class_name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-4">
                            <button type="submit" class="btn btn-success">
                                <i class="fas fa-filter"></i> {{ trans('Parents_Dashboard/attendance_trans.Filter') }}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

@if (isset($data['student']))
    <div class="row">
        <div class="col-xl-12 mb-30">
            <div class="card card-statistics h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0" style="font-family: 'Cairo', sans-serif">{{ $data['student']->name }}</h5>
                        <div class="text-muted">
                            {{ $data['student']->grade->grade_name }} /
                            {{ $data['student']->class->class_name }} /
                            {{ $data['student']->section->section_name }}
                        </div>
                    </div>

                    <!-- Statistics Cards -->
                    <div class="row mb-4">
                        <!-- Attendance Card -->
                        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
                            <div class="card card-statistics h-100">
                                <div class="card-body">
                                    <div class="clearfix">
                                        <div class="float-left">
                                            <span class="text-success">
                                                <i class="fas fa-user-check highlight-icon" aria-hidden="true"></i>
                                            </span>
                                        </div>
                                        <div class="float-right text-right">
                                            <p class="card-text text-dark">نسبة الحضور</p>
                                            <h4>{{ $data['attendance']['rate'] }}%</h4>
                                        </div>
                                    </div>
                                    <p class="text-muted pt-3 mb-0 mt-2 border-top">
                                        <i class="fas fa-calendar-check"></i> حضور:
                                        {{ $data['attendance']['present'] }}
                                        <br>
                                        <i class="fas fa-calendar-times"></i> غياب:
                                        {{ $data['attendance']['absent'] }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Exams Card -->
                        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
                            <div class="card card-statistics h-100">
                                <div class="card-body">
                                    <div class="clearfix">
                                        <div class="float-left">
                                            <span class="text-warning">
                                                <i class="fas fa-book-reader highlight-icon" aria-hidden="true"></i>
                                            </span>
                                        </div>
                                        <div class="float-right text-right">
                                            <p class="card-text text-dark">نتيجة آخر امتحان</p>
                                            <h4>{{ $data['exams']['latest_ratio'] }}</h4>
                                        </div>
                                    </div>
                                    <p class="text-muted pt-3 mb-0 mt-2 border-top">
                                        <i class="fas fa-graduation-cap"></i> المعدل العام:
                                        {{ $data['exams']['percentage'] }}%<br>
                                        <i class="fas fa-calculator"></i> المجموع:
                                        {{ $data['exams']['total_score'] }}/{{ $data['exams']['total_possible'] }}<br>
                                        <small>عدد الامتحانات: {{ $data['exams']['count'] }}</small>
                                    </p>
                                </div>
                            </div>
                        </div> <!-- Quizzes Card -->
                        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
                            <div class="card card-statistics h-100">
                                <div class="card-body">
                                    <div class="clearfix">
                                        <div class="float-left">
                                            <span class="text-danger">
                                                <i class="fas fa-question-circle highlight-icon" aria-hidden="true"></i>
                                            </span>
                                        </div>
                                        <div class="float-right text-right">
                                            <p class="card-text text-dark">نتيجة آخر اختبار</p>
                                            <h4>{{ $data['quizzes']['latest_ratio'] }}</h4>
                                        </div>
                                    </div>
                                    <p class="text-muted pt-3 mb-0 mt-2 border-top">
                                        <i class="fas fa-chart-bar"></i> المعدل العام:
                                        {{ $data['quizzes']['percentage'] }}%<br>
                                        <i class="fas fa-calculator"></i> المجموع:
                                        {{ $data['quizzes']['total_score'] }}/{{ $data['quizzes']['total_possible'] }}<br>
                                        <small>عدد الاختبارات: {{ $data['quizzes']['count'] }}</small>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Overall Performance Card -->
                        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
                            <div class="card card-statistics h-100">
                                <div class="card-body">
                                    <div class="clearfix">
                                        <div class="float-left">
                                            <span class="text-primary">
                                                <i class="fas fa-chart-line highlight-icon" aria-hidden="true"></i>
                                            </span>
                                        </div>
                                        <div class="float-right text-right">
                                            <p class="card-text text-dark">الأداء العام</p>
                                            <h4>{{ $data['overall_percentage'] }}%</h4>
                                        </div>
                                    </div>
                                    <p class="text-muted pt-3 mb-0 mt-2 border-top">
                                        <i class="fas fa-graduation-cap"></i> الامتحانات:
                                        {{ $data['exams']['percentage'] }}%<br>
                                        <i class="fas fa-question-circle"></i> الاختبارات:
                                        {{ $data['quizzes']['percentage'] }}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activities -->
                    <div class="row">
                        <div class="col-xl-6 mb-30">
                            <div class="card card-statistics h-100">
                                <div class="card-body">
                                    <h5 class="card-title">آخر الامتحانات</h5>
                                    <div class="table-responsive">
                                        <table class="table table-hover table-sm">
                                            <thead class="table-dark">
                                                <tr>
                                                    <th>التاريخ</th>
                                                    <th>الدرجة</th>
                                                    <th>ملاحظات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach ($data['exams']['recent'] as $exam)
                                                    <tr>
                                                        <td>{{ $exam->exam_date }}</td>
                                                        <td>
                                                            {{ $exam->degree }}/{{ $exam->final_degree }}
                                                            <div class="progress mt-1" style="height: 4px;">
                                                                <div class="progress-bar bg-{{ $exam->degree >= $exam->final_degree * 0.5 ? 'success' : 'danger' }}"
                                                                    role="progressbar"
                                                                    style="width: {{ ($exam->degree / $exam->final_degree) * 100 }}%">
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{{ $exam->notes }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-6 mb-30">
                            <div class="card card-statistics h-100">
                                <div class="card-body">
                                    <h5 class="card-title">آخر الاختبارات</h5>
                                    <div class="table-responsive">
                                        <table class="table table-hover table-sm">
                                            <thead class="table-dark">
                                                <tr>
                                                    <th>التاريخ</th>
                                                    <th>الدرجة</th>
                                                    <th>ملاحظات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach ($data['quizzes']['recent'] as $quiz)
                                                    <tr>
                                                        <td>{{ $quiz->quiz_date }}</td>
                                                        <td>
                                                            {{ $quiz->degree }}/{{ $quiz->final_degree }}
                                                            <div class="progress mt-1" style="height: 4px;">
                                                                <div class="progress-bar bg-{{ $quiz->degree >= $quiz->final_degree * 0.5 ? 'success' : 'danger' }}"
                                                                    role="progressbar"
                                                                    style="width: {{ ($quiz->degree / $quiz->final_degree) * 100 }}%">
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{{ $quiz->notes }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@else
    <div class="alert alert-warning" role="alert">
        {{ $data['message'] ?? 'لا يوجد بيانات' }}
    </div>
@endif

<!-- <div class="calendar-main mb-30">
    <livewire:calendar-student />
</div> -->

@endsection

@push('scripts')
<script>
    window.onload = function() {
        $('.fc-toolbar.fc-header-toolbar').addClass('row col-12 col-lg-12');
    };

    // add the responsive classes when navigating with calendar buttons
    $(document).on('click', '.fc-button', function(e) {
        $('.fc-toolbar.fc-header-toolbar').addClass('row col-12 col-lg-12');
    });
</script>
@endpush
