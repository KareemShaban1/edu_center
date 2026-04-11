@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/units_trans.units') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/units_trans.units') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">


    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <button type="button" class="bg-black hover:bg-black-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal" data-target="#add-unit-modal">
                    {{ trans('admin/units_trans.Add_Unit') }}
                </button>
                
                <br><br>

                <div class="table-responsive col-sm-12 col-12">
                    <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                        style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/units_trans.Name') }}</th>
                                <th>{{ trans('admin/units_trans.Notes') }}</th>
                                <th>{{ trans('admin/units_trans.Lessons') }}</th>
                                <th>{{ trans('admin/units_trans.Processes') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $i = 0; ?>
                            @foreach ($class->units as $unit)
                                <tr>
                                    <?php $i++; ?>
                                    <td>{{ $i }}</td>
                                    <td>{{ $unit->name }}</td>
                                    <td>{{ $unit->notes }}</td>
                                    <td>
                                        @foreach ($unit->lessons as $lesson)
                                            <a href="{{ route('classes.lessonQuestions', $lesson->id) }}" 
                                            style="margin-right: 5px;"
                                            class="btn btn-info btn-sm" role="button" aria-pressed="true">
                                                {{ $lesson->name }}
                                            </a>
                                            
                                        @endforeach
                                     
                                    </td>

                                    <td>
                                    <button type="button" class="btn btn-primary btn-sm" data-toggle="modal"
                                                data-target="#add-lesson-modal" title="{{ trans('admin/lessons_trans.Add_Lesson') }}"><i
                                                    class="fa fa-plus"></i>
                                                {{ trans('admin/lessons_trans.Add_Lesson') }}
                                                </button>
                                        <button type="button" class="btn btn-info btn-sm" data-toggle="modal"
                                            data-target="#edit{{ $unit->id }}"
                                            title="{{ trans('admin/units_trans.Edit') }}"><i
                                                class="fa fa-edit"></i></button>
                                        <button type="button" class="btn btn-danger btn-sm" data-toggle="modal"
                                            data-target="#delete{{ $unit->id }}"
                                            title="{{ trans('admin/units_trans.Delete') }}"><i
                                                class="fa fa-trash"></i></button>
                                    </td>
                                </tr>

                                @include('dashboards.admin.classes-units-lessons.edit-unit-modal')

                            @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>

    @include('dashboards.admin.classes-units-lessons.add-unit-modal')
    @include('dashboards.admin.classes-units-lessons.add-lesson-modal')



</div>

<!-- row closed -->
@endsection
@push('scripts')

@endpush
