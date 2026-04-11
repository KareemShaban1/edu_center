@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('admin/quiz_trans.Choose_Quiz_Day') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/quiz_trans.Choose_Quiz_Day') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                @forelse ($quizes->unique('quiz_date') as $quiz)
                    <a href="{{ Route('QuizDegree.show_quiz_degree', [$quiz->section_id, $quiz->quiz_date]) }}"
                        class="btn btn-success btn-sm" role="button" aria-pressed="true">
                        {{ $quiz->quiz_date }}
                    </a>
                @empty
                    <div style="text-align: center; font-size:30px">
                        {{ trans('admin/quiz_trans.There_Is_No_Quiz') }}</div>
                    <div style="display: flex; justify-content: center;" class="col-md-12 col-12">
                        <img src="{{ asset('images/icons/not_found.webp') }}" height="300" width="300"
                            alt="">
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
