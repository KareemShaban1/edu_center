@extends('layouts.master')
@section('css')
    
@section('title')
{{ trans('Teacher_Dashboard/online_classes_trans.Online_Courses') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('Teacher_Dashboard/online_classes_trans.Online_Courses') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">


                <div class="col-xl-12 mb-30">
                    <div class="card card-statistics h-100">
                        <div class="card-body">

                            <div class="table-responsive">
                                <table id="datatable" class="table  table-hover table-sm table-bordered p-0"
                                    data-page-length="50" style="text-align: center">
                                    <thead>
                                        <tr class="alert-success">
                                            <th>#</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Grade') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Class') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Section') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Teacher') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Title') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Date_Time') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Time') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Link') }}</th>
                                            <th>{{ trans('Teacher_Dashboard/online_classes_trans.Processes') }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($online_classes as $online_classe)
                                            <tr>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $online_classe->grade->grade_name }}</td>
                                                <td>{{ $online_classe->class->class_name }}</td>
                                                <td>{{ $online_classe->section->section_name }}</td>
                                                <td>{{ $online_classe->created_by }}</td>
                                                <td>{{ $online_classe->topic }}</td>
                                                <td>{{ $online_classe->start_at }}</td>
                                                <td>{{ $online_classe->duration }}</td>
                                                <td class="text-danger">
                                                    <a href="{{ $online_classe->join_url }}" target="_blank">{{ trans('Teacher_Dashboard/online_classes_trans.Join_Now') }}</a>
                                                </td>
                                                <td>
                                                    <button type="button" class="btn btn-danger btn-sm"
                                                        data-toggle="modal"
                                                        data-target="#Delete_online_course{{ $online_classe->meeting_id }}"><i
                                                            class="fa fa-trash"></i></button>
                                                </td>
                                            </tr>
                                            @include('dashboards.teacher.online_classes.delete')
                                        @endforeach
                                </table>
                            </div>
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
          { responsivePriority: 1, targets: 3 }, //  highest priority
          { responsivePriority: 2, targets: 6 }, //  lower priority
          { responsivePriority: 3, targets: 8 }, //  even lower priority
          { responsivePriority: 4, targets: 9 }, //  even lower priority
          // Add more columnDefs for other columns, if needed
        ],
        });
    });
    </script>
@endpush
