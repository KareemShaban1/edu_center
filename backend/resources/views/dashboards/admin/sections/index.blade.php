@extends('layouts.master')
@section('css')
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />

@section('title')
{{ trans('admin/sections_trans.Sections') }}
@stop
@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/sections_trans.Sections') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <a class="bg-black hover:bg-black-600 text-white text-xs px-3 py-2 rounded" href="#" data-toggle="modal" data-target="#addSectionModal">
                    {{ trans('admin/sections_trans.Add_Section') }}</a>
            </div>

            <x-backend.alert />

            <div class="card card-statistics h-100">
                <div class="card-body">
                    <div class="accordion gray plus-icon round">

                        @foreach ($grades as $grade)
                        <div class="acd-group">
                            <a href="#" class="acd-heading">
                                {{ $grade->grade_name }}</a>

                            <div class="row">
                                <div class="col-xl-12 mb-30">
                                    <div class="card card-statistics h-100">


                                        <div class="d-block d-md-flex justify-content-between">
                                            <div class="d-block">
                                            </div>
                                        </div>
                                        <div class="table-responsive">
                                            <table class="table center-aligned-table mb-0" id="sectionsTable" data-page-length="50">
                                                <thead>
                                                    <tr class="text-dark">
                                                        <th>#</th>
                                                        <th>{{ trans('admin/sections_trans.Section_Name') }}
                                                        </th>
                                                        <th>{{ trans('admin/sections_trans.Class_Name') }}
                                                        </th>
                                                        <th>{{ trans('admin/sections_trans.Number_of_Students') }}
                                                        </th>
                                                        <th>{{ trans('admin/sections_trans.Status') }}
                                                        </th>
                                                        <th>{{ trans('admin/sections_trans.Processes') }}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php $i = 0; ?>
                                                    @foreach ($grade->sections as $section)
                                                    <tr>
                                                        <?php $i++; ?>
                                                        <td>{{ $i }}</td>
                                                        <td>{{ $section->section_name }}</td>
                                                        <td>{{ $section->class->class_name }}
                                                        </td>
                                                        <td>{{ $section->students->count() }}</td>
                                                        <td>
                                                            @if ($section->status === 1)
                                                            <label
                                                                class="badge badge-success">{{ trans('admin/sections_trans.Active_Status') }}</label>
                                                            @else
                                                            <label
                                                                class="badge badge-danger">{{ trans('admin/sections_trans.Inactive_Status') }}</label>
                                                            @endif

                                                        </td>
                                                        <td>

                                                            <div class="flex flex-wrap items-center gap-2">

                                                                <a href="#"
                                                                    class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                                                                    data-toggle="modal"
                                                                    data-target="#editSectionModal{{ $section->id }}">{{ trans('admin/sections_trans.Edit') }}</a>
                                                                <a href="#"
                                                                    class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                                                                    data-toggle="modal"
                                                                    data-target="#deleteSectionModal{{ $section->id }}">{{ trans('admin/sections_trans.Delete') }}</a>

                                                                <a href="{{ route('sections.details', $section->id) }}"
                                                                    class="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1">{{ trans('admin/sections_trans.Details') }}</a>
                                                                <button type="button" class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1" data-toggle="modal"
                                                                    data-target="#addNote{{ $section->id }}"
                                                                    title="{{ trans('admin/sections_trans.Add_Note') }}"><i
                                                                        class="fa fa-add"></i>
                                                                    <span>{{ trans('admin/sections_trans.Add_Note') }}</span>

                                                                </button>
                                                                <a href="{{ route('sections.notes', $section->id) }}"
                                                                    class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1">{{ trans('admin/sections_trans.Notes') }}</a>

                                                                <a href="{{ route('report.sectionFees', [$section->id]) }}"
                                                                    class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1">{{ trans('admin/sections_trans.FeeReports') }}</a>


                                                            </div>


                                                        </td>
                                                    </tr>


                                                    @include('dashboards.admin.sections.add_notes')

                                                    @include('dashboards.admin.sections.edit_modal')

                                                    @include('dashboards.admin.sections.delete_modal')
                                                    @endforeach
                                                </tbody>
                                            </table>
                                        </div>

                                        {{-- </div> --}}
                                    </div>
                                </div>
                            </div>
                            {{-- </div> --}}
                            @endforeach

                        </div>
                    </div>
                </div>

                @include('dashboards.admin.sections.add_modal')

            </div>
        </div>
    </div>
    <!-- row closed -->
    @endsection



    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

    <script>
        $(document).ready(function() {
            $('.select2').select2();
        });
        $(document).ready(function() {
            $('select[name="Grade_id"]').on('change', function() {
                var Grade_id = $(this).val();
                if (Grade_id) {
                    $.ajax({
                        url: "{{ URL::to('classes') }}/" + Grade_id,
                        type: "GET",
                        dataType: "json",
                        success: function(data) {
                            $('select[name="Class_id"]').empty();
                            $.each(data, function(key, value) {
                                $('select[name="Class_id"]').append('<option value="' +
                                    key + '">' + value + '</option>');
                            });
                        },
                    });
                } else {
                    console.log('AJAX load did not work');
                }
            });
        });

        $('#sectionsTable').DataTable({
            responsive: true,
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 1
                }, //  highest priority
                {
                    responsivePriority: 2,
                    targets: 2
                }, //  lower priority
                {
                    responsivePriority: 3,
                    targets: 3
                }, //  even lower priority
                // Add more columnDefs for other columns, if needed
            ],
        });
    </script>

    @endpush