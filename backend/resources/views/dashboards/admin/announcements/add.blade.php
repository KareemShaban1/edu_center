@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/announcements_trans.Add_Announcement') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/announcements_trans.Add_Announcement') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <form method="post" action="{{ route('announcements.store') }}" autocomplete="off">
                    @csrf
                    <div class="form-row">
                        <div class="form-group col-12 col-md-6">
                            <label
                                for="title">{{ trans('admin/announcements_trans.Announcement_Name') }}</label>
                            <input type="text" id="title" name="title" class="form-control">
                        </div>




                        <div class="form-group col-12 col-md-6">
                            <label for="time">{{ trans('admin/announcements_trans.Date_Time') }}<span
                                    class="text-danger">*</span></label>
                            <input class="form-control" id="time" type="datetime-local" name="time">
                        </div>
                    </div>


                    <div class="form-row">

                        <div class="form-group col-12 col-md-4">
                            <label for="grade_id">{{ trans('admin/announcements_trans.Grade_Name') }}</label>
                            <select class="custom-select mr-sm-2" id="grade_id" name="grade_id">
                                <option selected disabled>{{ trans('admin/announcements_trans.Choose') }}...
                                </option>
                                @foreach ($grades as $grade)
                                    <option value="{{ $grade->id }}">{{ $grade->grade_name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div class="form-group col-12 col-md-4">
                            <label for="class_id"> {{ trans('admin/announcements_trans.Class_Name') }}</label>
                            <select class="custom-select mr-sm-2" id="class_id" name="class_id">

                            </select>
                        </div>

                        <div class="form-group col-12 col-md-4">
                            <label for="section_id">{{ trans('admin/announcements_trans.Section_Name') }}
                            </label>
                            <select class="custom-select mr-sm-2" id="section_id" name="section_id">

                            </select>
                        </div>
                    </div>


                    <div class="form-row">


                        <div class="form-group col-12 col-md-6">
                            <label
                                for="announcement_type">{{ trans('admin/announcements_trans.Announcement_Type') }}</label>
                            <select class="custom-select mr-sm-2" id="announcement_type" name="announcement_type">
                                <option selected disabled>{{ trans('admin/announcements_trans.Choose') }}...
                                </option>
                                <option value="quiz"> {{ trans('admin/announcements_trans.Quiz') }}
                                </option>
                                <option value="exam"> {{ trans('admin/announcements_trans.Exam') }}
                                </option>
                                <option value="others">{{ trans('admin/announcements_trans.Other') }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group ">
                        <label
                            for="body">{{ trans('admin/announcements_trans.Announcement_Text') }}</label>
                        <textarea class="form-control" name="body" id="body" rows="4"></textarea>
                    </div>
                    <br>

                    <button type="submit"
                        class="btn btn-primary">{{ trans('admin/announcements_trans.Add') }}</button>

                </form>

            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')

@endpush
