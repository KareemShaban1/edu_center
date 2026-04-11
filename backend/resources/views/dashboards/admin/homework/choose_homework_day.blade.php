@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('admin/homework_trans.Choose_Homework_Day') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/homework_trans.Choose_Homework_Day') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                @forelse ($homeworks->unique('submit_date') as $homework)
                    <a href="{{ Route('homework.show_homework_degree', [$homework->section_id, $homework->submit_date]) }}"
                        class="btn btn-success btn-sm" role="button" aria-pressed="true">

                       <span> {{ $homework->title }} </span>
                       <br>
                       <span>
                       {{ $homework->submit_date }}
                       </span>
                    </a>
                @empty
                <div class="col-md-12 col-12">
                    <div style="text-align: center; font-size:30px"> 
                        {{ trans('admin/homework_trans.No_Student_Exist') }}
                        
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
