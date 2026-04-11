@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/announcements_trans.Edit_Announcement') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/announcements_trans.Edit_Announcement') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <form method="post" action="{{ route('announcements.update', $announcement->id) }}" autocomplete="off">

                    @csrf
                    @method('PUT')

                    <div class="form-row">
                        <div class="form-group col-12 col-md-6">
                            <label
                                for="title">{{ trans('admin/announcements_trans.Announcement_Name') }}</label>
                            <input type="text" id="title" value="{{ $announcement->title }}" name="title"
                                class="form-control">
                        </div>




                        <div class="form-group col-12 col-md-6">
                            <label for="time"> {{ trans('admin/announcements_trans.Date_Time') }} <span
                                    class="text-danger">*</span></label>
                            <input class="form-control" id="time" value="{{ $announcement->time }}"
                                type="datetime-local" name="time">
                        </div>
                    </div>


                    <div class="form-row">

                        <div class="form-group col-12 col-md-4">
                            <label for="grade_id">{{ trans('admin/announcements_trans.Grade_Name') }}</label>
                            <select class="custom-select mr-sm-2" name="grade_id" id="grade_id">
                                @foreach ($grades as $grade)
                                    <option value="{{ $grade->id }}"
                                        {{ $grade->id == $announcement->grade_id ? 'selected' : '' }}>
                                        {{ $grade->grade_name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div class="form-group col-12 col-md-4">
                            <label for="class_id">{{ trans('admin/announcements_trans.Class_Name') }}</label>
                            <select class="custom-select mr-sm-2" name="class_id" id="class_id">
                                <option value="{{ $announcement->class_id }}">{{ $announcement->class->class_name }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group col-12 col-md-4">
                            <label
                                for="section_id">{{ trans('admin/announcements_trans.Section_Name') }}</label>
                            <select class="custom-select mr-sm-2" name="section_id" id="section_id">
                                <option value="{{ $announcement->section_id }}">
                                    {{ $announcement->section->section_name }}</option>
                            </select>
                        </div>

                    </div>


                    <div class="form-row">


                        <div class="form-group col-12 col-md-6">
                            <label
                                for="announcement_type">{{ trans('admin/announcements_trans.Announcement_Type') }}</label>
                            <select class="custom-select mr-sm-2" name="announcement_type" id="announcement_type">
                                <option selected disabled>
                                    {{ trans('admin/announcements_trans.Choose') }}......</option>
                                <option @if (old('announcement_type', $announcement->announcement_type) == 'quiz') selected @endif value="quiz">
                                    {{ trans('admin/announcements_trans.Quiz') }}
                                </option>
                                <option @if (old('announcement_type', $announcement->announcement_type) == 'exam') selected @endif value="exam">
                                    {{ trans('admin/announcements_trans.Exam') }}
                                </option>
                                <option @if (old('announcement_type', $announcement->announcement_type) == 'others') selected @endif value="others">
                                    {{ trans('admin/announcements_trans.Other') }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label
                            for="body">{{ trans('admin/announcements_trans.Announcement_Text') }}</label>
                        <textarea class="form-control" name="body" id="body" rows="4">
                                {{ $announcement->body }}
                            </textarea>
                    </div>
                    <br>

                    <button type="submit"
                        class="btn btn-primary">{{ trans('admin/announcements_trans.Submit') }}</button>

                </form>

            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')

@endpush
