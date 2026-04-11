@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/lessons_trans.lessons') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/lessons_trans.lessons') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">


    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <button type="button" class="button x-small" data-toggle="modal" data-target="#addLessonModal">
                    {{ trans('admin/lessons_trans.Add_Lesson') }}
                </button>
                <br><br>

                <div class="table-responsive col-sm-12 col-12">
                    <table id="datatable" class="table table-hover table-sm table-bordered p-0" data-page-length="50"
                        style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/lessons_trans.Class') }}</th>
                                <th>{{ trans('admin/lessons_trans.Unit') }}</th>
                                <th>{{ trans('admin/lessons_trans.Name') }}</th>
                                <th>{{ trans('admin/lessons_trans.Notes') }}</th>
                                <th>{{ trans('admin/lessons_trans.Processes') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $i = 0; ?>
                            @foreach ($lessons as $lesson)
                            <tr>
                                <?php $i++; ?>
                                <td>{{ $i }}</td>
                                <td>{{ $lesson->unit->classes->class_name }}</td>
                                <td>{{ $lesson->unit->name }}</td>
                                <td>{{ $lesson->name }}</td>
                                <td>{{ $lesson->notes }}</td>
                                <td>
                                    <div class="relative inline-block text-left">
                                        <button type="button" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                                            id="dropdownMenuButton{{ $lesson->id }}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <i class="fa fa-cogs"></i> {{ trans('admin/students_trans.Processes') }}
                                            <svg class="ml-1 w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        <div class="dropdown-menu absolute z-10 mt-1 bg-white rounded shadow-lg text-sm hidden group-hover:block"
                                            aria-labelledby="dropdownMenuButton{{ $lesson->id }}">
                                            <a href="{{ route('lessons.show', $lesson->id) }}" class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                                                title="{{ trans('admin/lessons_trans.Show') }}"><i
                                                    class="fa fa-eye text-gray-500"></i>
                                                {{ trans('admin/lessons_trans.Show') }}
                                            </a>
                                            <button type="button" class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2" data-toggle="modal"
                                                data-target="#edit{{ $lesson->id }}"
                                                title="{{ trans('admin/lessons_trans.Edit') }}"><i
                                                    class="fa fa-edit text-gray-500"></i>
                                                    {{ trans('admin/lessons_trans.Edit') }}
                                                </button>
                                            <button type="button" class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2" data-toggle="modal"
                                                data-target="#delete{{ $lesson->id }}"
                                                title="{{ trans('admin/lessons_trans.Delete') }}"><i
                                                    class="fa fa-trash text-gray-500"></i>
                                                    {{ trans('admin/lessons_trans.Delete') }}
                                                </button>
                                            <a href="{{ route('lessons.wordsModel', $lesson->id) }}"
                                                class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                                                <i class="fa fa-layer-group text-gray-500"></i> {{ trans('admin/lessons_trans.Words') }}
                                            </a>

                                        </div>
                                    </div>


                                </td>
                            </tr>

                            @include('dashboards.admin.lessons.edit_modal')

                            @include('dashboards.admin.lessons.delete_modal')
                            @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>


    @include('dashboards.admin.lessons.add_modal')


</div>

<!-- row closed -->
@endsection
@push('scripts')
@endpush