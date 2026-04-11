@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/quiz_trans.Section_Quiz') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/quiz_trans.Section_Quiz') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">


            <x-backend.alert />

            <div class="card card-statistics h-100">
                <div class="card-body">
                    <div class="accordion gray plus-icon round">

                        @foreach ($grades as $grade)
                        <div class="acd-group">
                            <a href="#" class="acd-heading">{{ $grade->grade_name }}</a>


                            <div class="row">
                                <div class="col-xl-12 mb-30">
                                    <div class="card card-statistics h-100">
                                        <div class="card-body">
                                            <div class="d-block d-md-flex justify-content-between">
                                                <div class="d-block">
                                                </div>
                                            </div>
                                            <div class="table-responsive mt-15">
                                                <table class="table center-aligned-table mb-0"
                                                    style="text-align: center">
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
                                                            <!-- <th></th> -->
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <?php $i = 0; ?>
                                                        @foreach ($grade->sections as $section)
                                                        <tr>
                                                            <?php $i++; ?>
                                                            <td>{{ $i }}</td>
                                                            <td>{{ $section->section_name }}</td>
                                                            <td>{{ $section->class->class_name }}</td>
                                                            <td>{{ $section->students->count() }}</td>

                                                            <td>
                                                                <label
                                                                    class="badge badge-{{ $section->status == 1 ? 'success' : 'danger' }}">{{ $section->status == 1
                                                                                ? trans('admin/sections_trans.Active')
                                                                                : trans('admin/sections_trans.Inactive') }}</label>
                                                            </td>

                                                            <td>
                                                                <div class="relative inline-block text-left">
                                                                    <button type="button" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                                                                        id="dropdownMenuButton{{ $section->id }}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                        <i class="fa fa-cogs"></i> {{ trans('admin/students_trans.Processes') }}
                                                                        <svg class="ml-1 w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                                            <path d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </button>

                                                                    <div class="dropdown-menu absolute z-10 mt-1 bg-white rounded shadow-lg text-sm hidden group-hover:block"
                                                                        aria-labelledby="dropdownMenuButton{{ $section->id }}">

                                                                        <a href="{{ route('QuizDegree.show_quiz_degree', [$section->id, carbon\Carbon::now('Egypt')->format('Y-m-d')]) }}"
                                                                            class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                                                                            role="button" aria-pressed="true">
                                                                            {{ trans('admin/quiz_trans.Today_Quiz') }}
                                                                        </a>
                                                                        <a href="{{ route('QuizDegree.choose_quiz_day', $section->id) }}"
                                                                            class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2" role="button"
                                                                            aria-pressed="true">
                                                                            {{ trans('admin/quiz_trans.Choose_Quiz_Day') }}
                                                                        </a>

                                                                    </div>
                                                                </div>
                                                            </td>
                                                           
                                                        </tr>
                                                        @endforeach
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        @endforeach

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
    </script>

    <script>
        $(document).ready(function() {
            $('#datatable').DataTable({
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
                        targets: 5
                    }, //  even lower priority
                    {
                        responsivePriority: 4,
                        targets: 6
                    }, //  even lower priority
                    // Add more columnDefs for other columns, if needed
                ],
            });
        });
    </script>
    @endpush