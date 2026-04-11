@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/library_trans.Add_Book') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/library_trans.Add_Book') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <div class="col-xs-12">
                    <div class="col-md-12">
                        <br>
                        <form action="{{ route('library.store') }}" method="post" enctype="multipart/form-data">
                            @csrf
                            <div class="form-row">

                                <div class="col-12">
                                    <label for="title">{{ trans('admin/library_trans.Book_Name') }}</label>
                                    <input type="text" name="title" id="title" class="form-control">
                                </div>

                            </div>
                            <br>

                            <div class="form-row">
                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label for="grade_id">{{ trans('admin/library_trans.Grade') }} : <span
                                                class="text-danger">*</span></label>
                                        <select class="custom-select mr-sm-2" name="grade_id" id="grade_id">
                                            <option selected disabled>
                                                {{ trans('admin/library_trans.Choose') }}...
                                            </option>
                                            @foreach ($grades as $grade)
                                            <option value="{{ $grade->id }}">{{ $grade->grade_name }}</option>
                                            @endforeach
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label for="class_id">{{ trans('admin/library_trans.Class') }} : <span
                                                class="text-danger">*</span></label>
                                        <select class="custom-select mr-sm-2" id="class_id" name="class_id">

                                        </select>
                                    </div>
                                </div>

                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label for="section_id">{{ trans('admin/library_trans.Section') }} :
                                        </label>
                                        <select class="custom-select mr-sm-2" id="section_id" name="section_id">

                                        </select>
                                    </div>
                                </div>

                            </div><br>



                            <div class="form-row">
                                <div class="col-12 col-md-12">
                                    <div class="form-group">
                                        <label for="files">{{ trans('admin/library_trans.Attachments') }}:
                                            <span class="text-danger">*</span>
                                        </label>
                                        <input type="file"
                                            accept="application/pdf,image/*"
                                            id="files"
                                            name="files[]"
                                            multiple
                                            required>
                                    </div>
                                </div>
                            </div>


                            <button class="btn btn-success btn-sm nextBtn btn-lg pull-right"
                                type="submit">{{ trans('admin/library_trans.Save') }}</button>
                        </form>
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
@endpush