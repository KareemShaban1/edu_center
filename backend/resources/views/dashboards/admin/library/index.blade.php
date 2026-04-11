@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/library_trans.Books') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/library_trans.Books') }}
<!-- breadcrumb -->
@endsection


@section('content')

<div class="col-xl-12 mb-30 p-0">
    <div class="card card-statistics h-100">
        <div class="card-body">
            <a href="{{ route('library.create') }}" class="btn btn-success btn-sm" role="button" aria-pressed="true">
                {{ trans('admin/library_trans.Add_Book') }}
            </a><br><br>
            <div class="table-responsive">
                <table id="datatable" class="table table-hover table-sm table-bordered p-0 m-0" data-page-length="50"
                    style="text-align: center">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{{ trans('admin/library_trans.Book_Name') }}</th>
                            <th>{{ trans('admin/library_trans.Grade') }}</th>
                            <th>{{ trans('admin/library_trans.Class') }}</th>
                            <th>{{ trans('admin/library_trans.Section') }}</th>
                            <th>{{ trans('admin/library_trans.Processes') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($books as $book)
                        <tr>
                            <td>{{ $loop->iteration }}</td>
                            <td>{{ $book->title }}</td>
                            <td>{{ $book->grade->grade_name }}</td>
                            <td>{{ $book->class->class_name }}</td>
                            <td>{{ $book->section->section_name }}</td>
                            <td>
                                <a href="{{ route('downloadAttachment', $book->id) }}"
                                    title="تحميل الكتاب"
                                    class="btn btn-warning btn-sm" role="button" aria-pressed="true">
                                    <i class="fas fa-download"></i>
                                </a>


                                <a href="{{ route('library.edit', $book->id) }}" class="btn btn-info btn-sm"
                                    role="button" aria-pressed="true"><i class="fa fa-edit"></i></a>
                                <button type="button" class="btn btn-danger btn-sm" data-toggle="modal"
                                    data-target="#delete_book{{ $book->id }}" title="حذف"><i
                                        class="fa fa-trash"></i></button>
                            </td>
                        </tr>

                        @include('dashboards.admin.library.destroy')
                        
                        @endforeach
                </table>
            </div>
        </div>
    </div>
</div>

@endsection
@push('scripts')
<script>
    $(document).ready(function() {
        $('#datatable').DataTable({
            responsive: true,
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 3
                }, //  highest priority
                {
                    responsivePriority: 2,
                    targets: 4
                }, //  lower priority
                {
                    responsivePriority: 3,
                    targets: 5
                }, //  even lower priority
                // { responsivePriority: 4, targets: 5 }, //  even lower priority
                // Add more columnDefs for other columns, if needed
            ],
        });
    });
</script>
@endpush