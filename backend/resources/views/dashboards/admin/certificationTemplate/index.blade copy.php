@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/certification_template_trans.certifications') }}
@stop
@endsection

@section('page-header')

{{ trans('admin/certification_template_trans.certifications') }}

@endsection

@section('content')
    <a href="{{ route('certifications.create') }}" class="btn btn-primary mb-3">
        {{ __('Create New Template') }}
    </a>

    <table class="table table-bordered">
        <thead>
            <tr><th>{{ __('Name') }}</th><th>{{ __('Actions') }}</th></tr>
        </thead>
        <tbody>
            @foreach ($templates as $template)
                <tr>
                    <td>{{ $template->title }}</td>
                    <td>
                        <a href="{{ route('certifications.edit', $template) }}" class="btn btn-warning btn-sm">Edit</a>
                        <a href="{{ route('certifications.show', $template) }}" class="btn btn-success btn-sm">Preview</a>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
