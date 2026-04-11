@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/parent_trans.Edit_Parent') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
    {{ trans('admin/parent_trans.Edit_Parent') }}
<!-- breadcrumb -->
@endsection


@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert/>

                <form action="{{ route('parents.update', $parent->id) }}" method="post" autocomplete="off">
                    @method('PUT')
                    @csrf
                   
                    
                    <div class="form-row">
                        <div class="col-12 col-md-3">
                            <label for="parent_name">{{ trans('admin/parent_trans.Parent_Name') }}</label>
                            <input type="text" value="{{ old('parent_name',$parent->parent_name ) }}" id="parent_name" 
                            name="parent_name" class="form-control">

                        </div>
                        <div class="col-12 col-md-3">
                            <label for="parent_job">{{ trans('admin/parent_trans.Parent_Job') }}</label>
                            <input type="text" value="{{ old('parent_job', $parent->parent_job) }}" name="parent_job" id="parent_job"
                            class="form-control">

                        </div>

                        <div class="col-12 col-md-3">
                            <label for="parent_phone">{{ trans('admin/parent_trans.Parent_Phone') }}</label>
                            <input type="text" value="{{ old('parent_phone', $parent->parent_phone) }}" name="parent_phone" id="parent_phone"
                            class="form-control">

                        </div>

                        <!-- is_active -->
                        <div class="col-12 col-md-3">
                            <label for="is_active">{{ trans('admin/parent_trans.is_active') }}</label>
                            <select name="is_active" id="is_active" class="form-control">
                                <option value="1" @selected($parent->is_active == 1)>{{ trans('admin/parent_trans.Active') }}</option>
                                <option value="0" @selected($parent->is_active == 0)>{{ trans('admin/parent_trans.Not_Active') }}</option>
                            </select>
                        </div>

                    </div>
                    <div class="form-row">
                        <div class="col-12 col-md-6">
                            <label for="email">{{ trans('admin/parent_trans.Email') }}</label>
                            <input type="email" value="{{ old('email',$parent->email) }}" name="email" id="email"
                            class="form-control">

                        </div>
                        <div class="col-12 col-md-6">
                            <label for="password">{{ trans('admin/parent_trans.Password') }}</label>
                            <input type="password" name="password" id="password" class="form-control">
                        </div>
                    </div>
  


                    <div class="form-group">
                        <label for="parent_address">{{ trans('admin/parent_trans.Parent_Address') }}</label>
                        <textarea class="form-control" value="{{ old('parent_address') }}" name="parent_address" id="parent_address" rows="4">
                        {{ $parent->parent_address }}
                        </textarea>

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
