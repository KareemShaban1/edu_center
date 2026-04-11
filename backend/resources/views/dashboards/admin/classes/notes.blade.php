@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/notes_trans.Notes') }}
@stop
@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/notes_trans.Notes') }}
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

                        <div class="row">
                            <div class="col-xl-12 mb-30">
                                <div class="card card-statistics h-100">


                                    <div class="d-block d-md-flex justify-content-between">
                                        <div class="d-block">
                                        </div>
                                    </div>
                                    <div class="table-responsive">
                                        <table class="table center-aligned-table mb-0">
                                            <thead>
                                                <tr class="text-dark">
                                                    <th>#</th>
                                                    <th>{{ trans('admin/notes_trans.Title') }}
                                                    </th>
                                                    <th>{{ trans('admin/notes_trans.Content') }}
                                                    </th>
                                                    <th>{{ trans('admin/notes_trans.Date_Time') }}
                                                    </th>

                                                    <th>{{ trans('admin/notes_trans.Processes') }}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php $i = 0; ?>
                                                @foreach ($notes as $note)
                                                <tr>
                                                    <?php $i++; ?>
                                                    <td>{{ $i }}</td>
                                                    <td>{{ $note->title }}</td>
                                                    <td>{{ $note->content }}
                                                    </td>
                                                    <td>{{ $note->date_time }}</td>

                                                    <td>

                                                        <a href="#"
                                                            class="btn btn-outline-info btn-sm"
                                                            data-toggle="modal"
                                                            data-target="#editNote{{ $note->id }}">{{ trans('admin/notes_trans.Edit') }}</a>
                                                        <a href="#"
                                                            class="btn btn-outline-danger btn-sm"
                                                            data-toggle="modal"
                                                            data-target="#delete{{ $note->id }}">{{ trans('admin/notes_trans.Delete') }}</a>

                                                    </td>
                                                </tr>


                                                @include('dashboards.admin.notes.edit_modal')


                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>

                                    {{-- </div> --}}
                                </div>
                            </div>

                        </div>
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

        });
    </script>

    @endpush