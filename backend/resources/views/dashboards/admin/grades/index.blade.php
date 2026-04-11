@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/grades_trans.grades') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/grades_trans.grades') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">


    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <button type="button" class="bg-black hover:bg-black-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal" data-target="#addGrade">
                    {{ trans('admin/grades_trans.Add_Grade') }}
                </button>
                <br><br>

                <div class="table-responsive col-sm-12 col-12">
                    <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                        style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/grades_trans.Name') }}</th>
                                <th>{{ trans('admin/grades_trans.Notes') }}</th>
                                <th>{{ trans('admin/grades_trans.Processes') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $i = 0; ?>
                            @foreach ($Grades as $grade)
                            <tr>
                                <?php $i++; ?>
                                <td>{{ $i }}</td>
                                <td>{{ $grade->grade_name }}</td>
                                <td>{{ $grade->notes }}</td>
                                <td class="flex justify-center">
                                    <div class="flex flex-wrap items-center gap-2">

                                        <button type="button" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal"
                                            data-target="#editGrade{{ $grade->id }}"
                                            title="{{ trans('admin/grades_trans.Edit') }}"><i
                                                class="fa fa-edit"></i></button>
                                        <button type="button" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal"
                                            data-target="#delete{{ $grade->id }}"
                                            title="{{ trans('admin/grades_trans.Delete') }}"><i
                                                class="fa fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>

                            @include('dashboards.admin.grades.edit_modal')

                            @include('dashboards.admin.grades.delete_modal')
                            @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>


    @include('dashboards.admin.grades.add_modal')


</div>

<!-- row closed -->
@endsection
@push('scripts')

@endpush