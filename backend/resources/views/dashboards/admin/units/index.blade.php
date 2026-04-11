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

                <button type="button" class="bg-black hover:bg-black-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal" data-target="#addUnitModal">
                    {{ trans('admin/units_trans.Add_Unit') }}
                </button>
                <br><br>

                <div class="table-responsive col-sm-12 col-12">
                    <table id="unitsTable" class="table table-hover table-sm table-bordered p-0" data-page-length="50"
                        style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/units_trans.Grade') }}</th>
                                <th>{{ trans('admin/units_trans.Class') }}</th>

                                <th>{{ trans('admin/units_trans.Name') }}</th>
                                <th>{{ trans('admin/units_trans.Lessons') }}</th>
                                <th>{{ trans('admin/units_trans.Notes') }}</th>
                                <th>{{ trans('admin/units_trans.Processes') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $i = 0; ?>

                            @foreach ($units as $unit)

                                <tr>
                                    <?php $i++; ?>
                                    <td>{{ $i }}</td>
                                    <td>{{ $unit->classes->grade->grade_name }}</td>
                                    <td>{{ $unit->classes->class_name }}</td>

                                    <td>{{ $unit->name }}</td>
                                    <td>
                                        @foreach ($unit->lessons as $lesson)
                                            <a href="{{ route('classes.lessonQuestions', $lesson->id) }}" 
                                            style="margin-right: 5px;"
                                            class="btn btn-info btn-sm" role="button" aria-pressed="true">
                                                {{ $lesson->name }}
                                            </a>
                                        @endforeach
                                    </td>
                                    <td>{{ $unit->notes }}</td>
                                    <td>
                                       <div class="flex flex-wrap items-center gap-2">
                                       <button type="button" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal"
                                            data-target="#edit{{ $unit->id }}"
                                            title="{{ trans('admin/units_trans.Edit') }}"><i
                                                class="fa fa-edit"></i></button>
                                        <button type="button" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal"
                                            data-target="#delete{{ $unit->id }}"
                                            title="{{ trans('admin/units_trans.Delete') }}"><i
                                                class="fa fa-trash"></i></button>

                                       </div>
                                    </td>
                                </tr>

                                @include('dashboards.admin.units.edit_modal')

                                @include('dashboards.admin.units.delete_modal')
                            @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>


    @include('dashboards.admin.units.addUnitmodal')




</div>

<!-- row closed -->
@endsection
@push('scripts')
<script>
    $(document).ready(function() {
        $('#unitsTable').DataTable(
            {
                searching: true,
                responsive: true,
                columnDefs: [
                    { responsivePriority: 1, targets: 6 }, //  highest priority
                    { responsivePriority: 2, targets: 7 }, //  lower priority
                    { responsivePriority: 3, targets: 8 }, //  even lower priority
                    { responsivePriority: 4, targets: 9 }, //  even lower priority
                    // Add more columnDefs for other columns, if needed
                ],
            }
        );
    });
</script>
@endpush
