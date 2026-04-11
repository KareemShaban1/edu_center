@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/library_trans.Edit_Book') }} {{ $book->title }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/library_trans.Edit_Book') }} {{ $book->title }}
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
                        <form action="{{ route('library.update', 'test') }}" method="post" enctype="multipart/form-data">

                            @method('PUT')
                            @csrf

                            <div class="form-row">

                                <div class="col-12">
                                    <label for="title">{{ trans('admin/library_trans.Book_Name') }}</label>
                                    <input type="text" name="title" id="title" value="{{ $book->title }}"
                                        class="form-control">
                                    <input type="hidden" name="id" value="{{ $book->id }}"
                                        class="form-control">
                                </div>

                            </div>
                            <br>

                            <div class="form-row">
                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label for="grade_id">{{ trans('admin/library_trans.Grade') }} : <span
                                                class="text-danger">*</span></label>
                                        <select class="custom-select mr-sm-2" id="grade_id" name="grade_id">
                                            <option selected disabled>
                                                {{ trans('admin/library_trans.Choose') }}...
                                            </option>
                                            @foreach ($grades as $grade)
                                            <option value="{{ $grade->id }}"
                                                {{ $book->grade_id == $grade->id ? 'selected' : '' }}>
                                                {{ $grade->grade_name }}
                                            </option>
                                            @endforeach
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label for="class_id">{{ trans('admin/library_trans.Class') }} :
                                            <span class="text-danger">*</span></label>
                                        <select class="custom-select mr-sm-2" id="class_id" name="class_id">
                                            <option value="{{ $book->class_id }}">{{ $book->class->class_name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label for="section_id">{{ trans('admin/library_trans.Section') }} :
                                        </label>
                                        <select class="custom-select mr-sm-2" id="section_id" name="section_id">
                                            <option value="{{ $book->section_id }}">{{ $book->section->section_name }}
                                            </option>
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
                                <div class="col-12 col-md-8">
                                    @php use Illuminate\Support\Str; @endphp

                                    @forelse ($book->library as $fileUrl)
                                    @if(Str::endsWith($fileUrl, '.pdf'))
                                    <embed src="{{ $fileUrl }}" type="application/pdf" width="100%" height="550px" class="mb-3">
                                    @elseif(Str::startsWith($fileUrl, ['http', 'https']) && Str::contains($fileUrl, ['jpg', 'jpeg', 'png', 'webp']))
                                    <img src="{{ $fileUrl }}" alt="Attachment" class="img-fluid mb-3" style="max-height: 300px;">
                                    @else
                                    <a href="{{ $fileUrl }}" target="_blank" class="btn btn-sm btn-outline-secondary mb-2">
                                        {{ basename($fileUrl) }} <i class="fas fa-download"></i>
                                    </a>
                                    @endif
                                    @empty
                                    <p>No attachments found.</p>
                                    @endforelse
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