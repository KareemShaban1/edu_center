@extends('layouts.master')

@section('css')
    @section('title')
        {{ trans('admin/attendance_trans.Attendance_Report') }}
    @stop

@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/attendance_trans.Attendance_Report') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->

@if ($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

@if (session('status'))
    <div class="alert alert-danger">
        <ul>
            <li>{{ session('status') }}</li>
        </ul>
    </div>
@endif



<h5 style="font-family: 'Cairo', sans-serif;color: red"> تاريخ اليوم : {{ date('Y-m-d') }}</h5>

<table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
    style="text-align: center">
    <thead>
        <tr>
            <th class="alert-success">#</th>
            <th class="alert-success">{{ trans('admin/attendance_trans.Name') }}</th>
            <th class="alert-success">{{ trans('admin/attendance_trans.Grade') }}</th>
            <th class="alert-success">{{ trans('admin/attendance_trans.Class') }}</th>
            <th class="alert-success">{{ trans('admin/attendance_trans.Section') }}</th>
            <th class="alert-success">{{ trans('admin/attendance_trans.Date') }}</th>
            <th class="alert-success">{{ trans('admin/attendance_trans.Attendance_Status') }}</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($attendances as $attendance)
            <tr>
                <td>{{ $loop->index + 1 }}</td>
                <td>{{ $attendance->student->name }}</td>
                <td>{{ $attendance->grade->grade_name }}</td>
                <td>{{ $attendance->class->class_name }}</td>
                <td>{{ $attendance->section->section_name }}</td>
                <td>{{ $attendance->attendance_date }}</td>
                <td>
                    @if ($attendance->attendance_status === 1)
                        <span class="text-success">{{ trans('admin/attendance_trans.Presence') }}</span>
                    @else
                        <span class="text-danger">{{ trans('admin/attendance_trans.Absent') }}</span>
                    @endif
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

<!-- row closed -->
@endsection
