@extends('layouts.master')

@section('css')
@section('title')
    {{ trans('admin/fees_trans.Groups_Fees') }}
@stop

@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/fees_trans.Groups_Fees') }}
<!-- breadcrumb -->
@endsection

@section('content')


<div class="col-xl-12 mb-30 p-0">
    <div class="card card-statistics h-100">
        <div class="card-body">
            <a href="{{ route('fees.create') }}" class="btn btn-success btn-sm" role="button"
                aria-pressed="true">{{ trans('admin/fees_trans.Add_Fee') }}</a><br><br>
            <div class="table-responsive">
                <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                    style="text-align: center">
                    <thead>
                        <tr class="alert-success">
                            <th>#</th>
                            <th>{{ trans('admin/fees_trans.Fees_Title') }} </th>
                            <th>{{ trans('admin/fees_trans.Amount') }}</th>
                            <th>{{ trans('admin/fees_trans.Grade') }}</th>
                            <th>{{ trans('admin/fees_trans.Class') }}</th>
                            <th>{{ trans('admin/fees_trans.Section') }}</th>
                            <th>{{ trans('admin/fees_trans.Month') }}</th>
                            <th>{{ trans('admin/fees_trans.Fee_Type') }}</th>
                            <th>{{ trans('admin/fees_trans.Processes') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($Fees as $Fee)
                            <tr>
                                <td>{{ $loop->iteration }}</td>
                                {{-- <td>{{$Fee->student->name}}</td> --}}
                                <td>{{ $Fee->title }}</td>
                                <td>{{ number_format($Fee->amount, 2) }}</td>
                                <td>{{ $Fee->grade->grade_name }}</td>
                                <td>{{ $Fee->class->class_name }}</td>
                                <td>{{ $Fee->section->section_name }}</td>
                                <td>{{ $Fee->month }}</td>

                                @if ($Fee->Fee_type == '0')
                                    <td>مصاريف شهر</td>
                                @elseif($Fee->Fee_type == '1')
                                    <td>مصاريف نص شهر</td>
                                @elseif($Fee->Fee_type == '2')
                                    <td>مصاريف مذكرة </td>
                                @elseif($Fee->Fee_type == '3')
                                    <td>مصاريف أخرى</td>
                                @endif

                                <td>
                                    <a href="{{ Route('fees.edit', $Fee->id) }}" class="btn btn-info btn-sm"
                                        role="button" aria-pressed="true"><i class="fa fa-edit"></i></a>
                                    <button type="button" class="btn btn-danger btn-sm" data-toggle="modal"
                                        data-target="#Delete_Fee{{ $Fee->id }}"><i
                                            class="fa fa-trash"></i></button>
                                </td>
                            </tr>
                            @include('dashboards.admin.fees.Delete')
                        @endforeach
                </table>
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
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 3
                }, //  highest priority
                {
                    responsivePriority: 2,
                    targets: 4
                }, //  lower priority
                //   { responsivePriority: 3, targets: 5 }, //  even lower priority
                {
                    responsivePriority: 4,
                    targets: 6
                }, //  even lower priority
                {
                    responsivePriority: 5,
                    targets: 8
                }, //  even lower priority
                // Add more columnDefs for other columns, if needed
            ],
        });
    });
</script>
@endpush
