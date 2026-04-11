@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/teacher_trans.Add_Teacher') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/teacher_trans.Add_Teacher') }}
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
                        <form action="{{ route('teachers.store') }}" method="post" autocomplete="off">
                            @csrf



                            <div class="form-row">
                                <div class="col-12 col-md-6">
                                    <label for="name">{{ trans('admin/teacher_trans.Name') }}</label>
                                    <input type="text" value="{{ old('name') }}" name="name" id="name" class="form-control">

                                </div>
                               
                            </div>

                            <br>

                            <div class="form-row">
                                <div class="col-12 col-md-6">
                                    <label for="email">{{ trans('admin/teacher_trans.Email') }}</label>
                                    <input type="email" value="{{ old('email') }}" name="email" id="email" class="form-control">

                                </div>
                                <div class="col-12 col-md-6">
                                    <label for="password">{{ trans('admin/teacher_trans.Password') }}</label>
                                    <input type="password" name="password" id="password" class="form-control">

                                </div>
                            </div>
                            <br>


                            <br>

                            <div class="form-row">

                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label for="gender"> {{ trans('admin/teacher_trans.Gender') }} <span
                                                class="text-danger">*</span></label>
                                        <select class="custom-select mr-sm-2" name="gender" id="gender">
                                            <option selected disabled>
                                                {{ trans('admin/teacher_trans.Choose') }}</option>
                                            <option value="male">{{ trans('admin/teacher_trans.Male') }}
                                            </option>
                                            <option value="female">{{ trans('admin/teacher_trans.Female') }}
                                            </option>
                                        </select>


                                    </div>
                                </div>

                                <div class="col-12 col-md-3">
                                    <label for="subject">{{ trans('admin/teacher_trans.Subject') }}</label>
                                    <input type="text" value="{{ old('subject') }}" name="subject" id="subject" class="form-control">

                                </div>

                                <div class="col-12 col-md-3">
                                    <label for="phone">{{ trans('admin/teacher_trans.Phone') }}</label>
                                    <div class='input-group date'>
                                        <input class="form-control" type="number" value="{{ old('phone') }}"id="phone" name="phone">
                                    </div>

                                </div>

                                <div class="col-12 col-md-3">
                                    <label
                                        for="datepicker-action">{{ trans('admin/teacher_trans.Joining_Date') }}</label>
                                    <div class='input-group date'>
                                        <input class="form-control" type="text" id="datepicker-action"
                                            value="{{ old('joining_date') }}" name="joining_date" data-date-format="yyyy-mm-dd">
                                    </div>

                                </div>
                            </div>
                            <br>

                            <div class="form-group">
                                <label for="address">{{ trans('admin/teacher_trans.Address') }}</label>
                                <textarea class="form-control" value="{{ old('address') }}" name="address" id="address" rows="4"></textarea>
                            </div>

                            <div>
                                <p>{{ trans('admin/teacher_trans.Sections') }}</p>
                                <div class="row">
                                    @foreach ($sections as $section)
                                        <div class="col-2">
                                            <input type="checkbox" name="section_ids[]" value="{{ $section->id }}"
                                                id="section_{{ $section->id }}">
                                        </div>
                                        <div class="col-10 mb-10">
                                            <label for="section_{{ $section->id }}">
                                                {{ $section->grade->grade_name }} /
                                                {{ $section->class->class_name }} /
                                                {{ $section->section_name }}
                                            </label>
                                        </div>
                                    @endforeach

                                </div>
                            </div>

                            <button class="btn btn-success btn-sm nextBtn btn-lg pull-right"
                                type="submit">{{ trans('admin/teacher_trans.Add') }}</button>
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
@endpush
