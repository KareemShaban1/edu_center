@extends('layouts.master')
@section('css')
@section('title')
{{ trans('Parents_Dashboard/attendance_trans.Attendance_Report') }}
@stop
@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('Parents_Dashboard/attendance_trans.Attendance_Report') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->
<x-backend.alert />

<div class="mb-4">
    <h6 class="mb-0">
        {{ $student->name }}
    </h6>
    {{ $student->grade->grade_name }} -
    {{ $student->class->class_name }} -
    {{ $student->section->section_name }}
</div>

@php
    use Carbon\Carbon;

    // Group attendances by month-year
    $groupedAttendances = $attendances
        ->sortBy('attendance_date') // first sort all records by date
        ->groupBy(function($item) {
            return Carbon::parse($item->attendance_date)->format('F Y');
        });

    // Optional: if you want the latest month first
    // $groupedAttendances = $groupedAttendances->sortByDesc(function($items, $month) {
    //     return Carbon::parse($items->first()->attendance_date)->format('Y-m');
    // });
@endphp

@foreach ($groupedAttendances as $month => $monthlyAttendances)
<div class="card">
    <div class="d-flex justify-content-between align-items-center mx-4 mt-4 mb-4 card-header"
    data-bs-toggle="collapse"
    href="#month-{{ Str::slug($month) }}"
    role="button"
    aria-expanded="false"
    aria-controls="month-{{ Str::slug($month) }}">
    <h4 class="text-primary" >
        {{ $month }}  <span class="badge bg-primary text-white">{{ $monthlyAttendances->count() }}</span>
       
    </h4>
    <i class="fas fa-chevron-down"></i>
    </div>
   

    <div class="collapse card-body" id="month-{{ Str::slug($month) }}">
        <div class="row">
            @foreach ($monthlyAttendances as $attendance)
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow-sm mb-4">
                        <div class="card-header bg-dark text-white">
                            <p class="mb-0">
                                <strong>{{ trans('Parents_Dashboard/attendance_trans.Date') }}:</strong>
                                {{ $attendance->attendance_date }}
                            </p>
                        </div>
                        <div class="card-body">
                            <p>
                                <strong>{{ trans('Parents_Dashboard/attendance_trans.Status') }}:</strong>
                                @if ($attendance->attendance_status == 1)
                                    <span class="badge bg-success text-white">{{ trans('Parents_Dashboard/attendance_trans.Presence') }}</span>
                                @else
                                    <span class="badge bg-danger text-white">{{ trans('Parents_Dashboard/attendance_trans.Absent') }}</span>
                                @endif
                            </p>

                            @if (!empty($attendance->notes))
                                <p>
                                    <strong>{{ trans('Parents_Dashboard/attendance_trans.Notes') }}:</strong>
                                    {{ $attendance->notes }}
                                </p>
                            @endif
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</div>
@endforeach



<!-- row closed -->
@endsection
