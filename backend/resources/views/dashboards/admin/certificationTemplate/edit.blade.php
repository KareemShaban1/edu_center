@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/certification_template_trans.edit_certification') }}
@stop
@endsection

@section('page-header')

{{ trans('admin/certification_template_trans.edit_certification') }}

@endsection


@section('content')
    <h4>Edit Template</h4>
    <form method="POST" action="{{ route('certifications.update', $certification) }}">
        @csrf
        @method('PUT')
        <input name="name" class="form-control mb-2" value="{{ $certification->title }}" required>
        <textarea name="content" id="content" class="form-control html-editor" rows="10" required>{{ $certification->content }}</textarea>
        <button class="btn btn-success mt-3">Update</button>
    </form>
@endsection

@push('scripts')
<script src="https://cdn.tiny.cloud/1/nv7068oqq6zjhc4eezadhfe89j7j4ieakunp6b037srgfd5q/tinymce/7/tinymce.min.js" referrerpolicy="origin"></script>
    <script>
       tinymce.init({
            selector: 'textarea#content',
            plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
            setup: function(editor) {
                editor.on('change', function() {
                    // Ensure the value of textarea is updated with TinyMCE content
                    tinymce.activeEditor.save();
                });
            }
        });
    </script>
@endpush