@extends('layouts.master')

@section('css')
@section('title')
    {{ trans('admin/announcements_trans.Announcements') }}
@stop

@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/announcements_trans.Announcements') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->
<div class="row">


    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <a href="{{ route('announcements.create') }}" class="btn btn-success btn-sm" role="button"
                    aria-pressed="true">{{ trans('admin/announcements_trans.Add_Announcement') }}</a><br><br>
                <div class="table-responsive">
                    <table id="datatable" class="table  table-hover table-sm nowarp table-bordered p-0"
                        data-page-length="50" style="text-align: center">
                        <thead>
                            <tr class="alert-success">
                                <th>#</th>
                                <th>{{ trans('admin/announcements_trans.Announcement_Name') }}</th>
                                <th>{{ trans('admin/announcements_trans.Grade_Name') }}</th>
                                <th>{{ trans('admin/announcements_trans.Class_Name') }}</th>
                                <th>{{ trans('admin/announcements_trans.Section_Name') }}</th>
                                <th>{{ trans('admin/announcements_trans.Date_Time') }}</th>
                                <th>{{ trans('admin/announcements_trans.Announcement_Type') }}</th>
                                <th>{{ trans('admin/announcements_trans.Control') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($announcements as $announcement)
                                <tr>
                                    <td>{{ $loop->iteration }}</td>
                                    <td>{{ $announcement->title }}</td>
                                    <td>{{ $announcement->grade->grade_name }}</td>
                                    <td>{{ $announcement->class->class_name }}</td>
                                    <td>{{ $announcement->section->section_name }}</td>
                                    <td>{{ $announcement->time }}</td>

                                    @if ($announcement->announcement_type == 'quiz')
                                        <td>{{ trans('admin/announcements_trans.Quiz') }}</td>
                                    @elseif($announcement->announcement_type == 'exam')
                                        <td> {{ trans('admin/announcements_trans.Exam') }}</td>
                                    @elseif($announcement->announcement_type == 'others')
                                        <td> {{ trans('admin/announcements_trans.Other') }} </td>
                                    @endif

                                    <td>
                                        <a href="{{ Route('announcements.edit', $announcement->id) }}"
                                            class="btn btn-info btn-sm" role="button" aria-pressed="true">
                                            <i class="fa fa-edit"></i>
                                        </a>
                                        <button type="button" class="btn btn-danger btn-sm" data-toggle="modal"
                                            data-target="#Delete_Announcement{{ $announcement->id }}">
                                            <i class="fa fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                @include('dashboards.admin.Announcements.Delete')
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
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 2
                }, //  highest priority
                {
                    responsivePriority: 2,
                    targets: 3
                }, //  lower priority
                {
                    responsivePriority: 3,
                    targets: 4
                }, //  even lower priority
                {
                    responsivePriority: 4,
                    targets: 7
                }, //  even lower priority
                // Add more columnDefs for other columns, if needed
            ],
        });
    });
</script>
@endpush
