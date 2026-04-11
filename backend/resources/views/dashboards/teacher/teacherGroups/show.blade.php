@extends('layouts.master')
@section('css')

@section('title')
{{ trans('Teacher_Dashboard/reports_trans.Sections') }}
@stop

@endsection

@section('page-header')
    <!-- breadcrumb -->
    {{ trans('Teacher_Dashboard/reports_trans.Sections') }}
    <!-- breadcrumb -->
@endsection

@section('content')

<!-- row -->
<div class="row">

    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <div class="table-responsive">
                    <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                        style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('Teacher_Dashboard/reports_trans.Grade') }}</th>
                                <th>{{ trans('Teacher_Dashboard/reports_trans.Class') }}</th>
                                <th>{{ trans('Teacher_Dashboard/reports_trans.Section') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($sections as $section)
                                <tr>
                                    <td>{{ $loop->iteration }}</td>
                                    <td>{{ $section->grade->grade_name }}</td>
                                    <td>{{ $section->class->class_name }}</td>
                                    <td>{{ $section->section_name }}</td>
                                </tr>
                            @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>

</div>

@endsection

