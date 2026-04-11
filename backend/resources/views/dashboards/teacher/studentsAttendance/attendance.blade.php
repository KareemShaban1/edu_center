@extends('layouts.master')
@section('css')

@section('title')
{{ trans('Teacher_Dashboard/attendance_trans.Attendance_List') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('Teacher_Dashboard/attendance_trans.Attendance_List') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->

<x-backend.alert />


<h5 style="font-family: 'Cairo', sans-serif;color: red">
    {{ trans('Teacher_Dashboard/attendance_trans.Today_Date') }} : {{ date('Y-m-d') }}
</h5>
<form method="post" action="{{ route('teacher_dashboard.attendanceStore') }}" autocomplete="off">

    @csrf

    <div class="table-responsive">
        <table id="datatable" class="table nowrap table-hover table-sm table-bordered p-0" data-page-length="50"
            style="text-align: center">
            <thead>
                <tr>
                    <th class="alert-success">#</th>
                    <th class="alert-success">{{ trans('Teacher_Dashboard/attendance_trans.Student_Name') }}</th>
                    <th class="alert-success">{{ trans('Teacher_Dashboard/attendance_trans.Gender') }}</th>
                    <th class="alert-success">{{ trans('Teacher_Dashboard/attendance_trans.Grade') }}</th>
                    <th class="alert-success">{{ trans('Teacher_Dashboard/attendance_trans.Class') }}</th>
                    <th class="alert-success">{{ trans('Teacher_Dashboard/attendance_trans.Section') }}</th>
                    <th class="alert-success">{{ trans('Teacher_Dashboard/attendance_trans.Attendance') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($students as $student)
                <tr>
                    <td>{{ $loop->index + 1 }}</td>
                    <td>{{ $student->name }}</td>
                    <td>{{ $student->gender }}</td>
                    <td>{{ $student->grade->grade_name }}</td>
                    <td>{{ $student->class->class_name }}</td>
                    <td>{{ $student->section->section_name }}</td>
                    <td>
                        <label class="block text-gray-500 font-semibold sm:border-r sm:pr-4">
                            <input name="attendances[{{ $student->id }}]"
                                @foreach ($student->attendance()->where('attendance_date', date('Y-m-d'))->get() as $attendance)
                            {{ $attendance->attendance_status == 1 ? 'checked' : '' }} @endforeach
                            class="leading-tight" type="radio" value="presence">
                            <span class="text-success">{{ trans('Teacher_Dashboard/attendance_trans.Presence') }}</span>
                        </label>

                        <label class="ml-4 block text-gray-500 font-semibold">
                            <input name="attendances[{{ $student->id }}]"
                                @foreach ($student->attendance()->where('attendance_date', date('Y-m-d'))->get() as $attendance)
                            {{ $attendance->attendance_status == 0 ? 'checked' : '' }} @endforeach
                            class="leading-tight" type="radio" value="absent">
                            <span class="text-danger">{{ trans('Teacher_Dashboard/attendance_trans.Absent') }}</span>
                        </label>

                        <input type="hidden" name="grade_id" value="{{ $student->grade_id }}">
                        <input type="hidden" name="class_id" value="{{ $student->class_id }}">
                        <input type="hidden" name="section_id" value="{{ $student->section_id }}">
                    </td>

                    

                </tr>
                @endforeach
            </tbody>
        </table>
        <button class="btn btn-success" type="submit">{{ trans('Teacher_Dashboard/attendance_trans.Submit') }}</button>

    </div>

</form><br>
<!-- row closed -->
@endsection
@push('scripts')

<script>
    $(document).ready(function() {
        $('#datatable').DataTable({
            responsive: true,
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 1
                }, //  highest priority
                {
                    responsivePriority: 2,
                    targets: 5
                }, //  lower priority
                {
                    responsivePriority: 3,
                    targets: 6
                }, //  even lower priority
                // Add more columnDefs for other columns, if needed
            ],
        });
    });
</script>
@endpush