@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/students_trans.Add_Student') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/students_trans.Add_Student') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />


                <form method="post" action="{{ route('students.store') }}" autocomplete="off"
                    enctype="multipart/form-data">
                    @csrf

                    <h6 style="font-family: 'Cairo', sans-serif;color: blue">
                        {{ trans('admin/students_trans.personal_information') }}</h6><br>

                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="name">{{ trans('admin/students_trans.name') }} : <span
                                        class="text-danger">*</span></label>
                                <input type="text" value="{{ old('name') }}" name="name" id="name" class="form-control">
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="gender">{{ trans('admin/students_trans.gender') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="gender" id="gender">
                                    <option selected disabled>{{ trans('admin/students_trans.Choose') }}...
                                    </option>
                                    <option value="male">{{ trans('admin/students_trans.male') }}</option>
                                    <option value="female">{{ trans('admin/students_trans.female') }}</option>
                                  
                                </select>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="is_active">{{ trans('admin/students_trans.is_active') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="is_active" id="is_active">
                                    <option selected disabled>{{ trans('admin/students_trans.Choose') }}...
                                    </option>
                                    <option value="1">{{ trans('admin/students_trans.active') }}</option>
                                    <option value="0">{{ trans('admin/students_trans.not_active') }}</option>
                                </select>
                            </div>
                        </div>

                        
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="email">{{ trans('admin/students_trans.email') }} : </label>
                                <input type="email" value="{{ old('email') }}" name="email" id="email" class="form-control">
                            </div>
                        </div>


                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="password">{{ trans('admin/students_trans.password') }} :</label>
                                <input type="password" name="password" id="password" class="form-control">
                            </div>
                        </div>

                        

                    </div>


                    <h6 style="font-family: 'Cairo', sans-serif;color: blue">
                        {{ trans('admin/students_trans.Student_information') }}</h6><br>

                    <div class="row">
                        <div class="col-md-2">
                            <div class="form-group">
                                <label for="grade_id">{{ trans('admin/students_trans.Grade') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="grade_id" id="grade_id">
                                    <option selected disabled>{{ trans('admin/students_trans.Choose') }}...
                                    </option>
                                    @foreach ($grades as $grade)
                                        <option value="{{ $grade->id }}">{{ $grade->grade_name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <div class="col-md-2">
                            <div class="form-group">
                                <label for="class_id">{{ trans('admin/students_trans.class') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="class_id" id="class_id">

                                </select>
                            </div>
                        </div>

                        <div class="col-md-2">
                            <div class="form-group">
                                <label for="section_id">{{ trans('admin/students_trans.section') }} :
                                </label>
                                <select class="custom-select mr-sm-2" name="section_id" id="section_id">

                                </select>
                            </div>
                        </div>

                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="parent_id">{{ trans('admin/students_trans.parent') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="parent_id" id="parent_id">
                                    <option selected disabled>{{ trans('admin/students_trans.Choose') }}...
                                    </option>
                                    @foreach ($parents as $parent)
                                        <option value="{{ $parent->id }}">{{ $parent->parent_name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="academic_year">{{ trans('admin/students_trans.academic_year') }}
                                    : <span class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="academic_year" id="academic_year">
                                    <option selected disabled>{{ trans('admin/students_trans.Choose') }}...
                                    </option>
                                    @php
                                        $current_year = date('Y');
                                    @endphp
                                    @for ($year = $current_year; $year <= $current_year + 1; $year++)
                                        <option value="{{ $year }}">{{ $year }}</option>
                                    @endfor
                                </select>
                            </div>
                        </div>
                    </div><br>

                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="photos">{{ trans('admin/students_trans.Attachments') }} :
                                <span class="text-danger">*</span></label>
                            <input type="file" accept="image/*" name="photos[]" id="photos" multiple>
                        </div>
                    </div>



                    <button class="btn btn-success btn-sm nextBtn btn-lg pull-right"
                        type="submit">{{ trans('admin/students_trans.submit') }}</button>
                </form>

            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')

@endpush
