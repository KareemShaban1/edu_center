@extends('layouts.master')
@section('css')
@section('title')
{{ trans('Parents_Dashboard/quiz_trans.quiz_Report') }}
@stop
@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('Parents_Dashboard/quiz_trans.quiz_Report') }}
<!-- breadcrumb -->
@endsection

@section('content')
<!-- row -->
<x-backend.alert />

<div class="mb-4">
    <h6 class="mb-0">
        {{ $student->name }}
    </h6>
    {{ $student->grade->grade_name }} -
    {{ $student->class->class_name }} -
    {{ $student->section->section_name }}
</div>

@php
    use Carbon\Carbon;

    // Group quizs by month-year
    $groupedquizs = $quizzes
        ->sortBy('quiz_date') // first sort all records by date
        ->groupBy(function($item) {
            return Carbon::parse($item->quiz_date)->format('F Y');
        });

    // Optional: if you want the latest month first
    // $groupedquizs = $groupedquizs->sortByDesc(function($items, $month) {
    //     return Carbon::parse($items->first()->quiz_date)->format('Y-m');
    // });
@endphp

@foreach ($groupedquizs as $month => $monthlyquizs)
    <h4 class="mt-4 mb-3 text-primary" data-bs-toggle="collapse"
        href="#month-{{ Str::slug($month) }}"
        role="button"
        aria-expanded="false"
        aria-controls="month-{{ Str::slug($month) }}">
        {{ $month }}
        <i class="bi bi-chevron-down ms-2"></i>
    </h4>

    <div class="collapse" id="month-{{ Str::slug($month) }}">
        <div class="row">
            @foreach ($monthlyquizs as $quiz)
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow-sm mb-4">
                        <div class="card-header bg-dark text-white">
                            <p class="mb-0">
                                <strong class="font-weight-bold">{{ trans('Parents_Dashboard/quiz_trans.Date') }}:</strong>
                                {{ $quiz->quiz_date }}
                            </p>
                        </div>
                        <div class="card-body">
                            <p>
                                <strong class="font-weight-bold">{{ trans('Parents_Dashboard/quiz_trans.Degree') }}:</strong>
                                {{ $quiz->degree  }} / {{ $quiz->final_degree }}
                            </p>

                                <p>
                                    <strong class="font-weight-bold">{{ trans('Parents_Dashboard/quiz_trans.Notes') }}:</strong>
                                    {{ $quiz->notes ?? '' }}
                                </p>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
@endforeach



<!-- row closed -->
@endsection
