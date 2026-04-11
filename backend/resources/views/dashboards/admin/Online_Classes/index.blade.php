@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/online_classes_trans.Online_Classes') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/online_classes_trans.Online_Classes') }} 
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">

                <div class="col-xl-12 mb-30 p-0">
                    <div class="card card-statistics h-100">
                        <div class="card-body">
                            <a href="{{ route('online_classes.create') }}" class="btn btn-success" role="button"
                                aria-pressed="true"> {{ trans('admin/online_classes_trans.Add_Online_Class') }} </a>
                            {{-- <a class="btn btn-warning" href="{{route('indirect.create.admin')}}">اضافة حصة اوفلاين جديدة</a> --}}
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
                                            <th>{{ trans('admin/online_classes_trans.Online_Class_Link') }}</th>
                                            <th>{{ trans('admin/online_classes_trans.Controls') }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($online_classes as $online_class)
                                            <tr>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $online_class->grade->grade_name }}</td>
                                                <td>{{ $online_class->class->class_name }}</td>
                                                <td>{{ $online_class->section->section_name }}</td>
                                                <td>{{ $online_class->created_by }}</td>
                                                <td>{{ $online_class->topic }}</td>
                                                <td>{{ $online_class->start_at }}</td>
                                                <td>{{ $online_class->duration }}</td>
                                                <td class="text-danger"><a href="{{ $online_class->join_url }}"
                                                        target="_blank">{{ trans('admin/online_classes_trans.Join_Now') }}
                                                    </a>
                                                </td>
                                                <td>
                                                    <button type="button" class="btn btn-danger btn-sm"
                                                        data-toggle="modal"
                                                        data-target="#Delete_receipt{{ $online_class->meeting_id }}"><i
                                                            class="fa fa-trash"></i></button>
                                                </td>
                                            </tr>
                                            @include('dashboards.admin.online_classes.delete')
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
            { responsivePriority: 1, targets: 6 }, //  highest priority
            { responsivePriority: 2, targets: 7 }, //  lower priority
            { responsivePriority: 3, targets: 8 }, //  even lower priority
            { responsivePriority: 4, targets: 9 }, //  even lower priority
            // Add more columnDefs for other columns, if needed
        ],
        });
    });
</script>
@endpush
