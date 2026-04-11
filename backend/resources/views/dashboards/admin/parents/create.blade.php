@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/parent_trans.Add_Parent') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/parent_trans.Add_Parent') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />


                <form method="post" action="{{ route('parents.store') }}" autocomplete="off"
                    enctype="multipart/form-data">
                    @csrf

                    <div class="form-row">
                        <div class="col-12 col-md-3">
                            <label for="parent_name">{{ trans('admin/parent_trans.Parent_Name') }}</label>
                            <input type="text" value="{{ old('parent_name') }}" id="parent_name" name="parent_name" class="form-control">

                        </div>
                        <div class="col-12 col-md-3">
                            <label for="parent_job">{{ trans('admin/parent_trans.Parent_Job') }}</label>
                            <input type="text" value="{{ old('parent_job') }}" name="parent_job" id="parent_job" class="form-control">

                        </div>

                        <div class="col-12 col-md-3">
                            <label for="parent_phone">{{ trans('admin/parent_trans.Parent_Phone') }}</label>
                            <input type="text" value="{{ old('parent_phone') }}" name="parent_phone" id="parent_phone" class="form-control">

                        </div>

                        <!-- is active -->
                         <div class="col-12 col-md-3">
                            <label for="is_active">{{ trans('admin/parent_trans.is_active') }}</label>
                            <select name="is_active" id="is_active" class="form-control">
                                <option value="1">{{ trans('admin/parent_trans.Active') }}</option>
                                <option value="0">{{ trans('admin/parent_trans.Not_Active') }}</option>
                            </select>
                        </div>


                    </div>
                    <div class="form-row">
                        <div class="col-12 col-md-6">
                            <label for="email">{{ trans('admin/parent_trans.Email') }}</label>
                            <input type="email" value="{{ old('email') }}" name="email" id="email" class="form-control">

                        </div>
                        <div class="col-12 col-md-6">
                            <label for="password">{{ trans('admin/parent_trans.Password') }}</label>
                            <input type="password" name="password" id="password" class="form-control">
                        </div>
                    </div>
  


                    <div class="form-group">
                        <label for="parent_address">{{ trans('admin/parent_trans.Parent_Address') }}</label>
                        <textarea class="form-control" value="{{ old('parent_address') }}" name="parent_address" id="parent_address" rows="4"></textarea>

                    </div>

                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="photos">{{ trans('admin/parent_trans.Attachments') }} :
                                <span class="text-danger">*</span></label>
                            <input type="file" accept="image/*" name="photos[]" id="photos" multiple>
                        </div>
                    </div>



                    <button class="btn btn-success btn-sm nextBtn btn-lg pull-right"
                        type="submit">{{ trans('admin/parent_trans.submit') }}</button>
                </form>

            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')

@endpush