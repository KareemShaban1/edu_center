@extends('layouts.master')
@section('css')

@section('title')
{{ trans('admin/classes_trans.All_Classes') }}
@stop

@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/classes_trans.All_Classes') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->
<div class="row">

    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <button type="button" class="bg-black hover:bg-black-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                    data-toggle="modal" data-target="#addClassModal">
                    {{ trans('admin/classes_trans.Add_Class') }}
                </button>




                <br><br>

                <div class="table-responsive">
                    <table id="classesTable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                        style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/classes_trans.Class_Name') }}</th>
                                <th>{{ trans('admin/classes_trans.Grade_Name') }}</th>
                                <th>{{ trans('admin/classes_trans.Processes') }}</th>
                            </tr>
                        </thead>
                        <tbody>

                            @if (isset($details))
                            <?php $List_Classes = $details; ?>
                            @else
                            <?php $List_Classes = $classes; ?>
                            @endif

                            <?php $i = 0; ?>

                            @foreach ($List_Classes as $class)
                            <tr>
                                <?php $i++; ?>
                                <td>{{ $i }}</td>
                                <td>{{ $class->class_name }}</td>
                                <td>{{ $class->grade->grade_name }}</td>
                                <td>
                                    <div class="flex flex-wrap items-center gap-2">
                                        <!-- Edit Button -->
                                        <button type="button" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                                            data-toggle="modal" data-target="#editClassModal{{ $class->id }}"
                                            title="{{ trans('admin/classes_trans.Edit') }}">
                                            <i class="fa fa-edit"></i> {{ trans('admin/classes_trans.Edit') }}
                                        </button>

                                        <!-- Delete Button -->
                                        <button type="button" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                                            data-toggle="modal" data-target="#deleteClassModal{{ $class->id }}"
                                            title="{{ trans('admin/classes_trans.Delete') }}">
                                            <i class="fa fa-trash"></i> {{ trans('admin/classes_trans.Delete') }}
                                        </button>

                                        <!-- Dropdown -->
                                        <div class="relative inline-block text-left">
                                            <button type="button" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1"
                                                id="dropdownMenuButton{{ $class->id }}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                <i class="fa fa-cogs"></i> {{ trans('admin/students_trans.Processes') }}
                                                <svg class="ml-1 w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                    <path d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            <div class="dropdown-menu absolute z-10 mt-1 bg-white rounded shadow-lg text-sm hidden group-hover:block"
                                                aria-labelledby="dropdownMenuButton{{ $class->id }}">
                                                <a href="{{ route('classes.classUnitsLessons', $class->id) }}"
                                                    class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                                                    <i class="fa fa-layer-group text-gray-500"></i> {{ trans('admin/classes_trans.Units') }}
                                                </a>

                                                <a href="{{ route('classes.classQuestions', $class->id) }}"
                                                    class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                                                    <i class="fa fa-question-circle text-blue-500"></i> {{ trans('admin/classes_trans.Class_Questions') }}
                                                </a>

                                                <a href="{{ route('classes.questionModel', $class->id) }}"
                                                    class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                                                    <i class="fa fa-file-alt text-indigo-500"></i> {{ trans('admin/classes_trans.Question_Model') }}
                                                </a>

                                                <button type="button" class="w-full text-left block px-4 py-2 hover:bg-gray-100 text-yellow-600 flex items-center gap-2"
                                                    data-toggle="modal" data-target="#addNote{{ $class->id }}">
                                                    <i class="fa fa-plus-circle"></i> {{ trans('admin/classes_trans.Add_Note') }}
                                                </button>

                                                <a href="{{ route('classes.notes', $class->id) }}"
                                                    class="block px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                                                    <i class="fa fa-sticky-note text-yellow-500"></i> {{ trans('admin/classes_trans.Notes') }}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </td>


                            </tr>

                            @include('dashboards.admin.classes.add_notes')

                            @include('dashboards.admin.classes.edit_modal')

                            @include('dashboards.admin.classes.delete_modal')

                            @endforeach
                    </table>
                </div>
            </div>
        </div>
    </div>

    @include('dashboards.admin.classes.add_modal')

</div>



@include('dashboards.admin.classes.delete_classes_modal')



</div>

</div>

<!-- row closed -->
@endsection
@push('scripts')

<script type="text/javascript">
    $(function() {
        $("#btn_delete_all").click(function() {
            var selected = new Array();
            $("#datatable input[type=checkbox]:checked").each(function() {
                selected.push(this.value);
            });

            if (selected.length > 0) {
                $('#delete_all').modal('show')
                $('input[id="delete_all_id"]').val(selected);
            }
        });

        $('#classesTable').DataTable({
            responsive: true,
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 1
                }, //  highest priority
                {
                    responsivePriority: 2,
                    targets: 3
                }, //  lower priority
                {
                    responsivePriority: 3,
                    targets: 4
                },

            ],
        });
    });
</script>

@endpush
