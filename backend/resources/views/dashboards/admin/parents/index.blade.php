@extends('layouts.master')

@section('css')
@section('title')
{{ trans('admin/parent_trans.Parents') }}
@stop

@endsection

@section('page-header')
{{ trans('admin/parent_trans.Parents') }}
@endsection

@section('content')

<!-- row -->
<div class="row">

    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <div class="d-flex justify-content-between m-4">

                <a href="{{ route('parents.create') }}" class="btn btn-success btn-sm" role="button"
                    aria-pressed="true">{{ trans('admin/parent_trans.Add_Parent') }}
                </a>

                <a href="{{ route('parents.importPage') }}" class="btn btn-success btn-sm" role="button"
                    aria-pressed="true">{{ trans('admin/parent_trans.Import_Parent') }}
                </a>
                </div>

                <div class="table-responsive">

                    <table id="parentsTable" class="table table-hover table-sm table-bordered p-0" style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/parent_trans.Parent_Name') }}</th>
                                <th>{{ trans('admin/parent_trans.Email') }}</th>
                                <th>{{ trans('admin/parent_trans.Processes') }}</th>
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
        $('#parentsTable').DataTable({
            processing: true,
            serverSide: true,
            pageLength: 50,
            searching: true,
            ajax: "{{ route('parents.data') }}",
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
                    data: 'actions',
                    name: 'actions',
                    orderable: false,
                    searchable: false
                }
            ],
            order: [
            [0, 'desc']
        ],
        buttons: [{
                extend: 'print',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4]
                }
            },
            {
                extend: 'excel',
                text: 'Excel',
                title: 'Users Data',
                exportOptions: {
                    columns: [0, 1, 2, 3]
                }
            },
            {
                extend: 'copy',
                exportOptions: {
                    columns: [0, 1, 2, 3]
                }
            },
        ],
        dom: '<"d-flex justify-content-between align-items-center mb-3"lfB>rtip',
        responsive: true,
        "drawCallback": function() {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
        });
    });
</script>
@endpush