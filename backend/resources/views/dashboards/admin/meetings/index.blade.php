@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/online_classes_trans.Online_Classes') }}
@stop
@endsection
@section('page-header')
{{ trans('admin/online_classes_trans.Online_Classes') }}
@endsection
@section('content')
<div class="row">
                <div class="col-xl-12 mb-30 p-0">
                    <div class="card card-statistics h-100">
                        <div class="card-body">
                            <a href="{{ route('meetings.create') }}" class="btn btn-success" role="button"
                                aria-pressed="true"> {{ trans('admin/online_classes_trans.Add_Online_Class') }} </a>
                            <div class="table-responsive">
                                <table id="datatable" class="table table-hover nowarp table-sm table-bordered p-0"
                                    style="text-align: center">
                                    <thead>
                                        <tr class="alert-success">
                                            <th>#</th>
                                            <th>{{ trans('admin/online_classes_trans.Grade') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Class') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Section') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Created_By') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Online_Class_Title') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Online_Class_Date') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Online_Class_Time') }}</th>
                                            <th>Provider</th>
                                            <th>{{ trans('admin/online_classes_trans.Online_Class_Link') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Controls') }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($meetings as $meeting)
                                            <tr>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $meeting->grade->grade_name }}</td>
                                                <td>{{ $meeting->class->class_name }}</td>
                                                <td>{{ $meeting->section->section_name }}</td>
                                                <td>{{ $meeting->created_by }}</td>
                                                <td>{{ $meeting->topic }}</td>
                                                <td>{{ $meeting->start_at }}</td>
                                                <td>{{ $meeting->duration }}</td>
                                                <td>{{ $meeting->provider }}</td>
                                                <td class="text-danger">
                                                    @if($meeting->provider === 'offline' || $meeting->provider === 'livekit')
                                                        —
                                                    @else
                                                        <a href="{{ $meeting->join_url }}" target="_blank">
                                                            {{ trans('admin/online_classes_trans.Join_Now') }}
                                                        </a>
                                                    @endif
                                                </td>
                                                <td>
                                                    <button type="button" class="btn btn-danger btn-sm"
                                                        data-toggle="modal"
                                                        data-target="#Delete_meeting{{ $meeting->id }}"><i
                                                            class="fa fa-trash"></i></button>
                                                </td>
                                            </tr>
                                            @include('dashboards.admin.meetings.delete', ['meeting' => $meeting])
                                        @endforeach
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

</div>
@endsection
@push('scripts')

<script>
    $(document).ready(function() {
        $('#datatable').DataTable({
        responsive: true,
        columnDefs: [
          { responsivePriority: 1, targets: 6 },
          { responsivePriority: 2, targets: 7 },
          { responsivePriority: 3, targets: 8 },
          { responsivePriority: 4, targets: 9 },
        ],
        });
    });
    </script>
@endpush
