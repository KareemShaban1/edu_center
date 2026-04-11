@extends('layouts.master')

@section('title')
{{ trans('admin/homework_trans.Submit_Homework') }}
@endsection

@section('content')
<div class="container">
    <h4>{{ trans('admin/homework_trans.Submit_Homework_For') }} <strong>{{ $homework->title }}</strong></h4>

    @if(session('success'))
    <div class="alert alert-success mt-2">
        {{ session('success') }}
    </div>
    @endif

    <form action="{{ route('student_homework.store') }}" method="POST" enctype="multipart/form-data">
        @csrf

        <input type="hidden" name="student_id" value="{{ auth()->user()->id }}">
        <input type="hidden" name="homework_id" value="{{ $homework->id }}">

        <div class="mb-3">
            <label>{{ trans('admin/homework_trans.Upload_Files') }}</label>
            <input type="file" name="files[]" id="file-input" class="form-control" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
        </div>

        <div id="file-preview" class="mt-3 d-flex flex-wrap gap-3"></div>


        <div class="mb-3">
            <label>{{ trans('admin/homework_trans.Notes') }}</label>
            <textarea name="notes" class="form-control" rows="3">
                {{ $submission->student_notes ?? '' }}
            </textarea>
        </div>

        
        <button type="submit" 
        @if($homework->due_date < now())
        disabled
        @endif
        class="btn btn-primary">{{ trans('admin/homework_trans.Submit_Homework') }}</button>
    </form>

    @if(isset($submission))
    <div class="mt-4">
    <hr>
    <h5>📁 {{ trans('admin/homework_trans.Your_Uploaded_File') }}</h5>
    @foreach ($submission->getMedia('homework_files') as $media)
    <div class="m-2">
        @if(in_array($media->mime_type, ['image/jpeg', 'image/png']))
        <img src="{{ $media->getFullUrl() }}" alt="Image" style="max-width: 200px;">
        @elseif($media->mime_type === 'application/pdf')
        <embed src="{{ $media->getFullUrl() }}" type="application/pdf" width="100%" height="400px">
        @else
        <a href="{{ $media->getFullUrl() }}" target="_blank">{{ trans('admin/homework_trans.Download_File') }}</a>
        @endif
    </div>
    @endforeach
    </div>
    @endif
</div>
@endsection

@push('scripts')
<script>
    document.getElementById('file-input').addEventListener('change', function(e) {
        const files = e.target.files;
        const preview = document.getElementById('file-preview');
        preview.innerHTML = ''; // Clear previous previews

        Array.from(files).forEach(file => {
            const fileType = file.type;
            const fileContainer = document.createElement('div');
            fileContainer.classList.add('border', 'p-2', 'rounded', 'shadow-sm');
            fileContainer.style.maxWidth = '200px';

            if (fileType.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.width = '100%';
                img.onload = () => URL.revokeObjectURL(img.src);
                fileContainer.appendChild(img);
            } else if (fileType === 'application/pdf') {
                const embed = document.createElement('embed');
                embed.src = URL.createObjectURL(file);
                embed.type = 'application/pdf';
                embed.width = '100%';
                embed.height = '200px';
                embed.onload = () => URL.revokeObjectURL(embed.src);
                fileContainer.appendChild(embed);
            } else {
                fileContainer.innerHTML = `<p class="text-muted">📄 ${file.name}</p>`;
            }

            preview.appendChild(fileContainer);
        });
    });
</script>


@endpush