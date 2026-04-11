@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/scertification_template_trans.create_certification') }}
@stop
@endsection

@section('page-header')

{{ trans('admin/certification_template_trans.create_certification') }}

@endsection

@section('content')
    <h4>Create Template</h4>
    <form method="POST" action="{{ route('certifications.store') }}" enctype="multipart/form-data">
        @csrf
        <input name="title" class="form-control mb-2" placeholder="Template Name" required>
        <textarea name="content" class="form-control html-editor" rows="10" placeholder="HTML Content..." required></textarea>
        <label class="mt-3">Background Image (optional):</label>
        <input type="file" name="background_image" class="form-control">
        <button class="btn btn-success mt-3">Save</button>
    </form>
@endsection

@push('scripts')
    <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
    <script>
        tinymce.init({ selector: '.html-editor', height: 400 });
    </script>
@endpush