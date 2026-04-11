@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('Student_Dashboard/sidebar_trans.Dashboard') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
<h4 class="mb-0" style="font-family: 'Cairo', sans-serif">مرحبا بك : {{ auth()->user()->name }}</h4>

<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->

<x-backend.alert />

<div class="row">
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
                    <i class="fas fa-calendar-check"></i> حضور: {{ $data['attendance']['present'] }}
                    <br>
                    <i class="fas fa-calendar-times"></i> غياب: {{ $data['attendance']['absent'] }}
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
                        <p class="card-text text-dark">متوسط الامتحانات</p>
                        <h4>{{ $data['exams']['latest_ratio'] }}</h4>
                    </div>
                </div>
                <p class="text-muted pt-3 mb-0 mt-2 border-top">
                    عدد الامتحانات: {{ $data['exams']['count'] }}<br>
                    المعدل الكلي: {{ $data['exams']['percentage'] }}%<br>
                    ({{ $data['exams']['total_score'] }}/{{ $data['exams']['total_possible'] }})
                </p>
            </div>
        </div>
    </div>

    <!-- Quizzes Card -->
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
                        <p class="card-text text-dark">متوسط الاختبارات</p>
                        <h4>{{ $data['quizzes']['latest_ratio'] }}</h4>
                    </div>
                </div>
                <p class="text-muted pt-3 mb-0 mt-2 border-top">
                    عدد الاختبارات: {{ $data['quizzes']['count'] }}<br>
                    المعدل الكلي: {{ $data['quizzes']['percentage'] }}%<br>
                    ({{ $data['quizzes']['total_score'] }}/{{ $data['quizzes']['total_possible'] }})
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
                        <h4>{{ round(($data['exams']['percentage'] + $data['quizzes']['percentage']) / 2, 1) }}%</h4>
                    </div>
                </div>
                <p class="text-muted pt-3 mb-0 mt-2 border-top">
                    <i class="fas fa-graduation-cap"></i> الامتحانات: {{ $data['exams']['percentage'] }}%<br>
                    <i class="fas fa-tasks"></i> الاختبارات: {{ $data['quizzes']['percentage'] }}%<br>
                    <small>المجموع الكلي:
                        {{ $data['exams']['total_score'] + $data['quizzes']['total_score'] }}/{{ $data['exams']['total_possible'] + $data['quizzes']['total_possible'] }}</small>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Recent Activities -->
<div class="row">
    <!-- Recent Exams -->
    <div class="col-xl-6 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <h5 class="card-title">آخر الامتحانات</h5>
                <div class="table-responsive">
                    <table class="table table-hover table-sm">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>الدرجة</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($data['exams']['recent'] as $exam)
                                <tr>
                                    <td>{{ \Carbon\Carbon::parse($exam->exam_date)->format('Y-m-d') }}</td>
                                    <td>
                                        <span
                                            class="font-weight-bold">{{ $exam->degree }}/{{ $exam->final_degree }}</span>
                                        <div class="progress" style="height: 4px;">
                                            @if ($exam->final_degree > 0 && $exam->final_degree != null)
                                                <div class="progress-bar bg-{{ ($exam->degree / $exam->final_degree) * 100 >= 50 ? 'success' : 'warning' }}"
                                                    role="progressbar"
                                                    style="width: {{ ($exam->degree / $exam->final_degree) * 100 }}%">
                                                </div>
                                            @endif>

                                        </div>
                                        @if ($exam->final_degree > 0 && $exam->final_degree != null)
                                            <small
                                                class="text-muted">{{ round(($exam->degree / $exam->final_degree) * 100, 1) }}%</small>
                                        @endif
                                    </td>
                                    <td>{{ $exam->notes ?? '-' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Quizzes -->
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
                                    <td>{{ \Carbon\Carbon::parse($quiz->quiz_date)->format('Y-m-d') }}</td>
                                    <td>
                                        <span
                                            class="font-weight-bold">{{ $quiz->degree }}/{{ $quiz->final_degree }}</span>
                                        <div class="progress" style="height: 4px;">
                                            @if ($quiz->final_degree > 0 && $quiz->final_degree != null)
                                                <div class="progress-bar bg-{{ ($quiz->degree / $quiz->final_degree) * 100 >= 50 ? 'success' : 'warning' }}"
                                                    role="progressbar"
                                                    style="width: {{ ($quiz->degree / $quiz->final_degree) * 100 }}%">
                                                </div>
                                                <div class="progress-bar bg-{{ ($quiz->degree / $quiz->final_degree) * 100 >= 50 ? 'success' : 'warning' }}"
                                                    role="progressbar"
                                                    style="width: {{ ($quiz->degree / $quiz->final_degree) * 100 }}%">
                                                </div>
                                            @endif>

                                        </div>
                                        @if ($quiz->final_degree > 0 && $quiz->final_degree != null)
                                            <small
                                                class="text-muted">{{ round(($quiz->degree / $quiz->final_degree) * 100, 1) }}%</small>
                                        @endif
                                    </td>
                                    <td>{{ $quiz->notes ?? '-' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Performance Trends -->
<div class="row">
    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <h5 class="card-title">تطور الأداء</h5>
                <div class="row">
                    <div class="col-md-6">
                        <h6>الامتحانات</h6>
                        <div class="progress mb-3">
                            @foreach ($data['exams']['trend'] as $score)
                                <div class="progress-bar bg-success" role="progressbar"
                                    style="width: {{ $score }}%" aria-valuenow="{{ $score }}"
                                    aria-valuemin="0" aria-valuemax="100">
                                    {{ $score }}
                                </div>
                            @endforeach
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>الاختبارات</h6>
                        <div class="progress">
                            @foreach ($data['quizzes']['trend'] as $score)
                                <div class="progress-bar bg-warning" role="progressbar"
                                    style="width: {{ $score }}%" aria-valuenow="{{ $score }}"
                                    aria-valuemin="0" aria-valuemax="100">
                                    {{ $score }}
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

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

@toastr_js
@toastr_render
@endpush
