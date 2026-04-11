@extends('layouts.master')
@section('css')
    
@section('title')
    {{ trans('Teacher_Dashboard/online_classes_trans.Add_Online_Course') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('Teacher_Dashboard/online_classes_trans.Add_Online_Course') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert/>

                <form method="post" action="{{ route('online_zoom_classes.store') }}" autocomplete="off">
                    @csrf
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="grade_id">    {{ trans('Teacher_Dashboard/online_classes_trans.Grade') }}: <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" id="grade_id" name="grade_id">
                                    
                                        <option value="{{ $grade->id }}" selected>{{ $grade->grade_name }}</option>
                                    
                                </select>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="class_id">{{ trans('Teacher_Dashboard/online_classes_trans.Class') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="class_id" id="class_id">
                                    <option value="{{ $class->id }}" selected>{{ $class->class_name }}</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="section_id">{{ trans('Teacher_Dashboard/online_classes_trans.Section') }} : </label>
                                <select class="custom-select mr-sm-2" name="section_id" id="section_id">
                                    <option value="{{ $section->id }}" selected>{{ $section->section_name }}</option>
                                </select>
                            </div>
                        </div>
                    </div><br>

                    <div class="row">

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="topic">{{ trans('Teacher_Dashboard/online_classes_trans.Title') }}: <span class="text-danger">*</span></label>
                                <input class="form-control" name="topic" id="topic" type="text">
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="start_time">{{ trans('Teacher_Dashboard/online_classes_trans.Date_Time') }}: <span class="text-danger">*</span></label>
                                <input class="form-control" type="datetime-local" id="start_time" name="start_time">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="duration">{{ trans('Teacher_Dashboard/online_classes_trans.Duration') }}: <span class="text-danger">*</span></label>
                                <input class="form-control" name="duration" id="duration" type="text">
                            </div>
                        </div>

                    </div>
                    <button class="btn btn-success btn-sm nextBtn btn-lg pull-right"
                        type="submit">{{ trans('Teacher_Dashboard/online_classes_trans.Submit')  }}</button>
                </form>

            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')


@endpush
