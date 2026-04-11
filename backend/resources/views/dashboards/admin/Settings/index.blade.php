@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/settings_trans.Settings') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/settings_trans.Settings') }}
<!-- breadcrumb -->
@endsection
@section('content')


<x-backend.alert />


<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <form enctype="multipart/form-data" method="post" action="{{ route('settings.update') }}">
                    @csrf
                    @method('PUT')
                    <div class="row">
                        <div class="col-md-12 border-right-2 border-right-blue-400">

                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Center_Name') }}
                                    <span class="text-danger">*</span></label>
                                <div class="col-lg-9">
                                    <input name="center_name" value="{{ $setting['center_name'] }}" required
                                        type="text" class="form-control" placeholder="Name of School">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="current_session" class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Current_Year') }}
                                    <span class="text-danger">*</span></label>
                                <div class="col-lg-9">
                                    <select data-placeholder="Choose..." required name="current_session"
                                        id="current_session" class="select-search form-control">
                                        <option value=""></option>
                                        @for ($y = date('Y', strtotime('- 3 years')); $y <= date('Y', strtotime('+ 1 years')); $y++)
                                            <option
                                                {{ $setting['current_session'] == ($y -= 1) . '-' . ($y += 1) ? 'selected' : '' }}>
                                                {{ ($y -= 1) . '-' . ($y += 1) }}</option>
                                        @endfor
                                    </select>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Center_Short_Name') }}
                                </label>
                                <div class="col-lg-9">
                                    <input name="center_title" value="{{ $setting['center_title'] }}" type="text"
                                        class="form-control" placeholder="School Acronym">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Phone') }}
                                </label>
                                <div class="col-lg-9">
                                    <input name="phone" value="{{ $setting['phone'] }}" type="text"
                                        class="form-control" placeholder="Phone">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Email') }}
                                </label>
                                <div class="col-lg-9">
                                    <input name="center_email" value="{{ $setting['center_email'] }}" type="email"
                                        class="form-control" placeholder="School Email">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Address') }}
                                    <span class="text-danger">*</span></label>
                                <div class="col-lg-9">
                                    <input required name="address" value="{{ $setting['address'] }}" type="text"
                                        class="form-control" placeholder="School Address">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.First_Term_End') }}
                                </label>
                                <div class="col-lg-9">
                                    <input name="end_first_term" value="{{ $setting['end_first_term'] }}"
                                        type="text" class="form-control date-pick" placeholder="Date Term Ends">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Second_Term_End') }}
                                </label>
                                <div class="col-lg-9">
                                    <input name="end_second_term" value="{{ $setting['end_second_term'] }}"
                                        type="text" class="form-control date-pick" placeholder="Date Term Ends">
                                </div>
                            </div>
                            <br>
                            <br>
                            <div class="form-group row">
                                <label class="col-lg-2 col-form-label font-weight-semibold">
                                    {{ trans('admin/settings_trans.Logo') }}
                                </label>
                                <div class="col-lg-9" style="display: inline">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <input name="logo" accept="image/*" type="file" class="file-input"
                                                data-show-caption="false" data-show-upload="false" data-fouc>
                                        </div>
                                        <div class="col-md-6">
                                            @if ($setting['logo'])
                                                <div class="mb-3">
                                                    <img style="width: 100px" height="100px"
                                                        src="{{ URL::asset('storage/attachments/settings/' . $setting['logo']) }}"
                                                        alt="">
                                                </div>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <hr>
                    <button class="btn btn-success btn-sm nextBtn btn-lg pull-right" type="submit">
                        {{ trans('admin/settings_trans.Submit') }}
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')
@endpush
