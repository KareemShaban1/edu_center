@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/students_trans.Student_details') }}
@stop
@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/students_trans.Student_details') }}
<!-- breadcrumb -->
@endsection


@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <div class="card-body">

                    <div class="tab nav-border">

                        <ul class="nav nav-tabs" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link active show" id="home-02-tab" data-toggle="tab" href="#home-02"
                                    role="tab" aria-controls="home-02"
                                    aria-selected="true">{{ trans('admin/students_trans.Student_details') }}</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="profile-02-tab" data-toggle="tab" href="#profile-02"
                                    role="tab" aria-controls="profile-02"
                                    aria-selected="false">{{ trans('admin/students_trans.Attachments') }}</a>
                            </li>
                        </ul>

                        <div class="tab-content">
                            <div class="tab-pane fade active show" id="home-02" role="tabpanel"
                                aria-labelledby="home-02-tab">
                                <table class="table  table-hover" style="text-align:center">
                                    <tbody>
                                        <tr>
                                            <th scope="row">{{ trans('admin/students_trans.name') }}</th>
                                            <td class="text-success">{{ $Student->name }}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">{{ trans('admin/students_trans.email') }}</th>
                                            <td class="text-success">{{ $Student->email }}</td>
                                        </tr>
                                        <tr>

                                            <th scope="row">{{ trans('admin/students_trans.gender') }}</th>
                                            <td class="text-success">{{ $Student->gender }}</td>

                                        </tr>
                                        </tr>
                                        <tr>
                                            <th scope="row">{{ trans('admin/students_trans.parent') }}
                                            </th>
                                            <td class="text-success">{{ $Student->parents->father_name }}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">
                                                {{ trans('admin/students_trans.academic_year') }}
                                            </th>
                                            <td class="text-success">{{ $Student->academic_year }}</td>

                                        </tr>
                                        <tr>
                                            <th scope="row">{{ trans('admin/students_trans.Grade') }}</th>
                                            <td class="text-success">{{ $Student->grade->grade_name }}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">{{ trans('admin/students_trans.class') }}</th>
                                            <td class="text-success">{{ $Student->class->class_name }}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">{{ trans('admin/students_trans.section') }}
                                            </th>
                                            <td class="text-success">{{ $Student->section->section_name }}</td>

                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="tab-pane fade" id="profile-02" role="tabpanel" aria-labelledby="profile-02-tab">
                                <div class="card card-statistics">
                                    <div class="card-body">
                                        <form method="post" action="{{ route('Upload_attachment',$Student->id) }}"
                                            enctype="multipart/form-data" autocomplete="off">

                                            @csrf

                                            <div class="col-md-3">
                                                <div class="form-group">
                                                    <label
                                                        for="photos">{{ trans('admin/students_trans.Attachments') }}
                                                        : <span class="text-danger">*</span></label>
                                                    <input type="file" accept="image/*" name="files[]"
                                                        id="files" multiple required>
                                                    <input type="hidden" name="student_name"
                                                        value="{{ $Student->name }}">
                                                    <input type="hidden" name="student_id"
                                                        value="{{ $Student->id }}">
                                                </div>
                                            </div>
                                            <br><br>
                                            <button type="submit" class="button button-border x-small">
                                                {{ trans('admin/students_trans.submit') }}
                                            </button>
                                        </form>
                                    </div>
                                    <br>
                                    <table class="table center-aligned-table mb-0 table table-hover" style="text-align:center">
                                        <thead>
                                            <tr class="table-secondary">
                                                <th scope="col">#</th>
                                                <th scope="col">{{ trans('admin/students_trans.filename') }}</th>
                                                <th scope="col">{{ trans('admin/students_trans.created_at') }}</th>
                                                <th scope="col">{{ trans('admin/students_trans.Processes') }}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($Student->files as $file)
                                            <tr style='text-align:center;vertical-align:middle'>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $file['filename'] }}</td>
                                                <td>{{ \Carbon\Carbon::parse($file['created_at'])->diffForHumans() }}</td>
                                                <td>
                                                    <a class="btn btn-outline-info btn-sm" href="{{ $file['url'] }}" download>
                                                        <i class="fas fa-download"></i>&nbsp;{{ trans('admin/students_trans.Download') }}
                                                    </a>

                                                    <!-- Delete button triggers modal -->
                                                    <button type="button" class="btn btn-outline-danger btn-sm" data-toggle="modal"
                                                        data-target="#DeleteFileModal{{ $file['id'] }}">
                                                        <i class="fas fa-trash"></i>&nbsp;{{ trans('admin/students_trans.delete') }}
                                                    </button>

                                                    <!-- Delete Modal -->
                                                    <div class="modal fade" id="DeleteFileModal{{ $file['id'] }}" tabindex="-1" role="dialog"
                                                        aria-labelledby="DeleteFileModalLabel{{ $file['id'] }}" aria-hidden="true">
                                                        <div class="modal-dialog modal-dialog-centered" role="document">
                                                            <form method="POST" action="{{ route('students.delete_file', $file['id']) }}">
                                                                @csrf
                                                                @method('DELETE')
                                                                <div class="modal-content">
                                                                    <div class="modal-header">
                                                                        <h5 class="modal-title">{{ trans('admin/students_trans.delete') }}</h5>
                                                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                                            <span aria-hidden="true">&times;</span>
                                                                        </button>
                                                                    </div>
                                                                    <div class="modal-body">
                                                                        {{ trans('admin/students_trans.confirm_delete_file') }}
                                                                        <br><strong>{{ $file['filename'] }}</strong>
                                                                    </div>
                                                                    <div class="modal-footer">
                                                                        <button type="button" class="btn btn-secondary"
                                                                            data-dismiss="modal">{{ trans('admin/students_trans.cancel') }}</button>
                                                                        <button type="submit" class="btn btn-danger">{{ trans('admin/students_trans.confirm') }}</button>
                                                                    </div>
                                                                </div>
                                                            </form>
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
        </div>

        <!-- row closed -->
        @endsection
        @push('scripts')
        @endpush