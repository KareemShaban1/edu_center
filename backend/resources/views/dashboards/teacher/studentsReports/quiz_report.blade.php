@extends('layouts.master')
@section('css')

@section('title')
{{ trans('Teacher_Dashboard/reports_trans.Quiz_Report') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('Teacher_Dashboard/reports_trans.Quiz_Report') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->

<x-backend.alert />



<h5 style="font-family: 'Cairo', sans-serif;color: red"> {{ trans('Teacher_Dashboard/reports_trans.Today_Date') }} : {{ date('Y-m-d') }}</h5>

<table id="datatable" class="table  table-hover table-sm table-bordered p-0"
    style="text-align: center">
    <thead>
        <tr>
            <th class="alert-success">#</th>
            <th class="alert-success">{{ trans('Teacher_Dashboard/reports_trans.Student_Name') }}</th>
            <th class="alert-success">{{ trans('Teacher_Dashboard/reports_trans.Grade') }}</th>
            <th class="alert-success">{{ trans('Teacher_Dashboard/reports_trans.Class') }}</th>
            <th class="alert-success">{{ trans('Teacher_Dashboard/reports_trans.Section') }}</th>
            <th class="alert-success">{{ trans('Teacher_Dashboard/reports_trans.Quiz_Date') }}</th>
            <th class="alert-success">{{ trans('Teacher_Dashboard/reports_trans.Degree') }}</th>
            <th class="alert-success">{{ trans('Teacher_Dashboard/reports_trans.Notes') }}</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($quizzes as $quiz)
        <tr>
            <td>{{ $loop->index + 1 }}</td>
            <td>{{ $quiz->students->name }}</td>
            <td>{{ $quiz->grade->grade_name }}</td>
            <td>{{ $quiz->class->class_name }}</td>
            <td>{{ $quiz->section->section_name }}</td>
            <td>{{ $quiz->quiz_date }}</td>
            <td>{{ $quiz->degree }} </td>
            <td>{{ $quiz->notes }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

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
                    targets: 4
                }, //  lower priority
                {
                    responsivePriority: 3,
                    targets: 5
                }, //  even lower priority
                {
                    responsivePriority: 4,
                    targets: 6
                }, //  even lower priority
                // Add more columnDefs for other columns, if needed
            ],
        });
    });
</script>
@endpush