@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/fees_trans.Edit_Fee') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/fees_trans.Edit_Fee') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <form action="{{ route('fees.update', 'test') }}" method="post" autocomplete="off">
                    @method('PUT')
                    @csrf

                    <div class="form-row">
                        <div class="form-group col-12 col-md-6">
                            <label for="title">{{ trans('admin/fees_trans.Fees_Title') }}</label>
                            <input type="text" id="title" value="{{ $fee->getTranslation('title', 'ar') }}"
                                name="title" class="form-control">
                            <input type="hidden" value="{{ $fee->id }}" name="id" class="form-control">
                        </div>



                        <div class="form-group col-12 col-md-6">
                            <label for="amount">{{ trans('admin/fees_trans.Amount') }}</label>
                            <input type="number" id="amount" value="{{ $fee->amount }}" name="amount"
                                class="form-control">
                        </div>

                    </div>


                    <div class="form-row">

                        <div class="form-group col-12 col-md-4">
                            <label for="grade_id"> {{ trans('admin/fees_trans.Grade') }}</label>
                            <select class="custom-select mr-sm-2" name="grade_id" id="grade_id">
                                @foreach ($grades as $grade)
                                    <option value="{{ $grade->id }}"
                                        {{ $grade->id == $fee->grade_id ? 'selected' : '' }}>{{ $grade->grade_name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <div class="form-group col-12 col-md-4">
                            <label for="class_id"> {{ trans('admin/fees_trans.Class') }} </label>
                            <select class="custom-select mr-sm-2" name="class_id" id="class_id">
                                <option value="{{ $fee->class_id }}">{{ $fee->class->class_name }}</option>
                            </select>
                        </div>

                        <div class="form-group col-12 col-md-4">
                            <label for="section_id">{{ trans('admin/fees_trans.Section') }} </label>
                            <select class="custom-select mr-sm-2" name="section_id" id="section_id">
                                <option value="{{ $fee->section_id }}">{{ $fee->section->section_name }}</option>
                            </select>
                        </div>

                    </div>

                    <div class="form-row">

                        <div class="form-group col-12 col-md-4">
                            <label for="month"> {{ trans('admin/fees_trans.Month') }}</label>
                            <select class="custom-select mr-sm-2" name="month" id="month"
                                @if ($fee->month == old('month', $fee->month)) selected @endif>
                                <option selected disabled>{{ trans('Parent_trans.Choose') }}...</option>

                                @foreach ($months as $month)
                                    <option value="{{ $month->title }}"
                                        {{ $fee->month == $month->title ? 'selected' : '' }}>{{ $month->title }}
                                    </option>
                                @endforeach

                            </select>

                        </div>

                        <div class="form-group col-12 col-md-4">
                            <label for="year"> {{ trans('admin/fees_trans.Year') }}</label>
                            <select class="custom-select mr-sm-2" name="year" id="year">
                                @php
                                    $current_year = date('Y');
                                @endphp
                                @for ($year = $current_year; $year <= $current_year + 1; $year++)
                                    <option value="{{ $year }}" {{ $year == $fee->year ? 'selected' : ' ' }}>
                                        {{ $year }}</option>
                                @endfor
                            </select>
                        </div>
                        <div class="form-group col-12 col-md-4">
                            <label for="fee_type">{{ trans('admin/fees_trans.Fee_Type') }}</label>
                            <select class="custom-select mr-sm-2" name="Fee_type" id="fee_type"
                                @if ($fee->Fee_type == old('Fee_type', $fee->Fee_type)) selected @endif>
                                <option selected disabled>{{ trans('Parent_trans.Choose') }}...</option>
                                <option value="0" @if (old('Fee_type', $fee->Fee_type) == '0') selected @endif>
                                    {{ trans('admin/fees_trans.Month_Fees') }}
                                </option>
                                <option value="1" @if (old('Fee_type', $fee->Fee_type) == '1') selected @endif>
                                    {{ trans('admin/fees_trans.Half_Month_Fees') }}
                                </option>
                                <option value="2" @if (old('Fee_type', $fee->Fee_type) == '2') selected @endif>
                                    {{ trans('admin/fees_trans.Notes_Fees') }}
                                </option>
                                <option value="3" @if (old('Fee_type', $fee->Fee_type) == '3') selected @endif>
                                    {{ trans('admin/fees_trans.Other_Fees') }}
                                </option>
                            </select>
                        </div>
                    </div>


                    <div class="form-group">
                        <label for="description">{{ trans('admin/fees_trans.Notes') }}</label>
                        <textarea class="form-control" name="description" id="description" rows="4">{{ $fee->description }}</textarea>
                    </div>
                    <br>

                    <button type="submit"
                        class="btn btn-primary">{{ trans('admin/fees_trans.Submit') }}</button>

                </form>

            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')

@endpush
