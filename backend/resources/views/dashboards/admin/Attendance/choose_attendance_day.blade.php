@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('admin/attendances_trans.Choose_attendance_Day') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/attendances_trans.Choose_attendance_Day') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                @forelse ($attendances->unique('attendance_date') as $attendance)
                    <a href="{{ Route('attendance.show_attendance', [$attendance->section_id, $attendance->attendance_date]) }}"
                        class="btn btn-success btn-sm" role="button" aria-pressed="true">

                        {{ $attendance->attendance_date }}
                    </a>
                @empty
                <div class="col-md-12 col-12">
                    <div style="text-align: center; font-size:30px"> 
                        {{ trans('admin/attendances_trans.No_Student_Exist') }}
                        
                    </div>
                    <div style="display: flex; justify-content: center;" class="col-12 col-md-12">
                        <img src="{{ asset('images/icons/not_found.webp') }}" height="300" width="300" alt="">
                    </div>
                </div>
                @endforelse


                </div>
            </div>
        </div>
    </div>
    <!-- row closed -->
@endsection
@push('scripts')

@endpush
