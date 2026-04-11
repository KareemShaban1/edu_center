@extends('layouts.master')

@section('css')
@section('title')
{{ trans('admin/students_trans.Students') }}
@stop

@endsection

@section('page-header')
{{ trans('admin/students_trans.Students') }}
@endsection

@section('content')

<!-- row -->
<div class="row">

    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

               <div class="d-flex justify-content-between">
               <a href="{{ route('students.create') }}" class="btn btn-success btn-sm" role="button"
                    aria-pressed="true">{{ trans('main_trans.add_student') }}
                </a>
                <a href="{{ route('students.importPage') }}" class="btn btn-success btn-sm" role="button"
                    aria-pressed="true">{{ trans('admin/students_trans.Import_Students') }}
                </a>
               </div>
                <br><br>

                <div class="table-responsive">

                    <table id="datatable" class="table table-hover table-sm table-bordered p-0" style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/students_trans.name') }}</th>
                                <th>{{ trans('admin/students_trans.email') }}</th>
                                <th>{{ trans('admin/students_trans.gender') }}</th>
                                <th>{{ trans('admin/students_trans.Grade') }}</th>
                                <th>{{ trans('admin/students_trans.class') }}</th>
                                <th>{{ trans('admin/students_trans.section') }}</th>
                                <th>{{ trans('admin/students_trans.Processes') }}</th>
                            </tr>
                        </thead>
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
    $(function() {
        $('#datatable').DataTable({
            processing: true,
            serverSide: true,
            ajax: '{{ route('students.data') }}',
            columns: [{
                    data: 'DT_RowIndex',
                    name: 'DT_RowIndex',
                    orderable: false,
                    searchable: false
                },
                {
                    data: 'name',
                    name: 'name'
                },
                {
                    data: 'email',
                    name: 'email'
                },
                {
                    data: 'gender',
                    name: 'gender'
                },
                {
                    data: 'grade.grade_name.ar',
                    name: 'grade.grade_name'
                },
                {
                    data: 'class.class_name.ar',
                    name: 'class.class_name'
                },
                {
                    data: 'section.section_name.ar',
                    name: 'section.section_name'
                },
                {
                    data: 'actions',
                    name: 'actions',
                    orderable: false,
                    searchable: false
                }
            ]
        });
    });
</script>
@endpush