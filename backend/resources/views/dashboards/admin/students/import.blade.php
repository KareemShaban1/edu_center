@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/students_trans.Import_Students') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/students_trans.Import_Students') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->


<form action="{{ route('students.import') }}" method="POST" enctype="multipart/form-data">
    @csrf
    <label>{{ trans('admin/students_trans.Select_Excel_File') }}:</label>
    <input type="file" name="file" required>
    <button type="submit" class="btn btn-primary">{{ trans('admin/students_trans.Import') }}</button>
</form>

@if(session('imported') || session('skipped'))
<div class="card-body mb-5">
    <h4 class="text-success">{{ trans('admin/students_trans.Import_Summary') }}</h4>

    <p><b>{{ trans('admin/students_trans.Imported_Records') }}:</b> {{ count(session('imported')) }}</p>
    <ul>
        @foreach(session('imported') as $student)
        <li>{{ $student->student_name }} ({{ $student->email }})</li>
        @endforeach
    </ul>
</div>

<div class="card-body mb-5">
    <p class="text-danger"><b>{{ trans('admin/students_trans.Skipped_Records') }}:</b> {{ count(session('skipped')) }}</p>
    <ul>
        @foreach(session('skipped') as $fail)
        <li>{{ trans('admin/students_trans.Row') }}: {{ $fail['row'] ?? 'N/A' }} -
            {{ $fail['reason'] ?? implode(', ', $fail['errors'] ?? []) }}
            ({{ $fail['values']['email'] ?? '' }})
        </li>
        @endforeach
    </ul>
</div>
@endif



@endsection


</Content>