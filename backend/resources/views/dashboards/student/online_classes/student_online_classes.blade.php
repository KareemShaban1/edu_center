@extends('layouts.master')
@section('css')
    
@section('title')
{{ trans('Student_Dashboard/student_trans.Online_Classes') }}
@stop
@endsection
@section('page-header')
    <!-- breadcrumb -->
    {{ trans('Student_Dashboard/student_trans.Online_Classes') }}
<!-- breadcrumb -->
@endsection
@section('content')
    <!-- row -->

    <x-backend.alert/>

    
    <h5 style="font-family: 'Cairo', sans-serif;color: red"> {{ trans('Student_Dashboard/student_trans.Today_Date') }}: {{ date('Y-m-d') }}</h5>
    <div class="table-responsive">
        <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                style="text-align: center">
            <thead>
            <tr>
                <th class="alert-success">#</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Online_Classes_Title') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Date_Time') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Grade') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Class') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Section') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Processes') }}</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($online_classes as $online_class)
                <tr>
                    <td>{{ $loop->index + 1 }}</td>
                    <td>{{ $online_class->topic}}</td>
                    <td>{{ $online_class->start_at}}</td>
                    <td>{{ $online_class->grade->grade_name }}</td>
                    <td>{{ $online_class->class->class_name }}</td>
                    <td>{{ $online_class->section->section_name }}</td>
                    <td class="text-danger"><a href="{{$online_class->join_url}}" target="_blank">
                            {{ trans('Student_Dashboard/student_trans.Join_Now') }}
                        </a>
                    </td>
            </tr>
            @endforeach
            </tbody>
        </table>
    </div>
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
                        targets: 2
                    }, //  lower priority
                    {
                        responsivePriority: 3,
                        targets: 5
                    },
                    {
                        responsivePriority: 4,
                        targets: 6
                    },
                    
                    // Add more columnDefs for other columns, if needed
                ],
            });
        });
    </script>
@endpush
