@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('Parents_Dashboard/attendance_trans.Attendance_Search') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('Parents_Dashboard/attendance_trans.Attendance_Search') }}
<!-- breadcrumb -->
@endsection
@section('content')
    <!-- row -->
    <div class="row">
        <div class="col-md-12 mb-30">
            <div class="card card-statistics h-100">
                <div class="card-body">

                    <x-backend.alert />

                    <form method="post" action="{{ route('sons.attendance.search') }}" autocomplete="off">
                        @csrf
                        <h6 style="font-family: 'Cairo', sans-serif;color: blue">معلومات البحث</h6><br>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="student"> {{ trans('Parents_Dashboard/attendance_trans.Students') }}</label>
                                    <select class="custom-select mr-sm-2" name="student_id">
                                        <option value="0"> {{ trans('Parents_Dashboard/attendance_trans.Choose_Student') }}</option>
                                        @foreach ($students as $student)
                                            <option value="{{ $student->id }}">{{ $student->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>

                            <div class="card-body datepicker-form">
                                <div class="input-group" data-date-format="yyyy-mm-dd">
                                    <input type="text" class="form-control range-from date-picker-default"
                                        placeholder="تاريخ البداية" required name="from">
                                    <span class="input-group-addon"> {{ trans('Parents_Dashboard/attendance_trans.To_Date') }}</span>
                                    <input class="form-control range-to date-picker-default" placeholder="تاريخ النهاية"
                                        type="text" required name="to">
                                </div>
                            </div>

                        </div>

                        <button class="btn btn-success btn-sm nextBtn btn-lg pull-right"
                            type="submit">{{ trans('Parents_Dashboard/attendance_trans.Submit') }}</button>
                    </form>


                    @isset($studentsAttendance)
                        <div class="table-responsive">
                            <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                                style="text-align: center">
                                <thead>
                                    <tr>
                                        <th class="alert-danger">#</th>
                                        <th class="alert-danger">{{ trans('Parents_Dashboard/attendance_trans.Student_Name') }}</th>
                                        <th class="alert-danger">{{ trans('Parents_Dashboard/attendance_trans.Grade') }}</th>
                                        <th class="alert-danger"> {{ trans('Parents_Dashboard/attendance_trans.Section') }}</th>
                                        <th class="alert-danger"> {{ trans('Parents_Dashboard/attendance_trans.Date') }}</th>
                                        <th class="alert-warning"> {{ trans('Parents_Dashboard/attendance_trans.Status') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($studentsAttendance as $attendance)
                                        <tr>
                                            <td>{{ $loop->index + 1 }}</td>
                                            <td>{{ $attendance->student->name }}</td>
                                            <td>{{ $attendance->grade->grade_name }}</td>
                                            <td>{{ $attendance->section->section_name }}</td>
                                            <td>{{ $attendance->attendance_date }}</td>
                                            <td>

                                                @if ($attendance->attendance_status == 0)
                                                    <span class="btn-danger">{{ trans('Parents_Dashboard/attendance_trans.Absent') }}</span>
                                                @else
                                                    <span class="btn-success">{{ trans('Parents_Dashboard/attendance_trans.Presence') }}</span>
                                                @endif
                                            </td>
                                        </tr>
                                    @endforeach
                            </table>
                        </div>
                    @endisset

                </div>
            </div>
        </div>
    </div>
    <!-- row closed -->
@endsection
@push('scripts')
<script>
    $(document).ready(function() {
        $('#datatable').DataTable({
        responsive: true,
        columnDefs: [
          { responsivePriority: 1, targets: 1 }, //  highest priority
          { responsivePriority: 2, targets: 3 }, //  lower priority
          { responsivePriority: 3, targets: 4 }, //  even lower priority
          { responsivePriority: 4, targets: 5 }, //  even lower priority
          // Add more columnDefs for other columns, if needed
        ],
        });
    });
</script>
@endpush
