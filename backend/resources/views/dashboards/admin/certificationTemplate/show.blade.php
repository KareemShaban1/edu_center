@extends('layouts.master')
@section('css')
@push('styles')
<style>
    .editable-placeholder {
        border-bottom: 1px dashed #007bff;
        padding: 10px;
        cursor: text;
    }

    .bg-thumbnail.selected {
        border: 3px solid #007bff;
    }
</style>
@endpush
@section('title')
{{ trans('admin/certification_template_trans.Show_Template') }}
@stop
@endsection

@section('page-header')
{{ trans('admin/certification_template_trans.Show_Template') }}
@endsection

@section('content')
<h3>{{ $certification->title }}</h3>

@php
$placeholders = [
'student_name' => '',
];

$rendered = preg_replace_callback('/{{\s*(\w+)\s*}}/', function ($matches) use ($placeholders) {
$key = $matches[1];
$value = $placeholders[$key] ?? '';
return "<span contenteditable='true' data-key='{$key}' class='editable-placeholder'>{$value}</span>";
}, $certification->content);

$backgroundUrl = $certification->getFirstMediaUrl('certification_background');
$backgrounds = \Spatie\MediaLibrary\MediaCollections\Models\Media::where('collection_name', 'certification_background')->get();
@endphp

<div class="mb-4">
    <label><strong>Choose Background:</strong></label>
    <div class="d-flex flex-wrap gap-3">
        @foreach($backgrounds as $bg)
        <img src="{{ $bg->getUrl() }}"
            class="bg-thumbnail border"
            onclick="changeBackground(this, '{{ $bg->getUrl() }}')"
            style="width: 150px; height: auto; cursor: pointer; border-radius: 8px;" />
        @endforeach
    </div>
</div>

<div id="certificateContent"
    class="border p-3"
    style="position: relative; background: url('{{ $backgroundUrl }}') no-repeat center center;
           background-size: contain; min-height: 1000px; padding: 50px; color: #000;
           display: flex; flex-direction: column; align-items: center; justify-content: center;">
    {!! $rendered !!}
</div>

<form action="{{ route('certifications.generatePdf', $certification->id) }}" method="POST" onsubmit="captureEditedContent()">
    @csrf
    <input type="hidden" name="final_content" id="finalContent">
    <input type="hidden" name="selected_background" id="selectedBackground" value="{{ $backgroundUrl }}">
    <button class="btn btn-primary mt-3">Generate PDF</button>
</form>
@endsection

@push('scripts')
<script>
    function changeBackground(element, url) {
        const cert = document.getElementById('certificateContent');
        cert.style.backgroundImage = `url('${url}')`;

        // Set hidden input for form
        const bgInput = document.getElementById('selectedBackground');
        if (bgInput) {
            bgInput.value = url;
        }

        // Highlight selected thumbnail
        document.querySelectorAll('.bg-thumbnail').forEach(img => img.classList.remove('selected'));
        element.classList.add('selected');
    }

    function captureEditedContent() {
        const content = document.getElementById('certificateContent').innerHTML;
        document.getElementById('finalContent').value = content;
    }
</script>
@endpush