@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('admin/dashboard_trans.Dashboard') }}
@stop

@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/dashboard_trans.Dashboard') }}
<!-- breadcrumb -->
@endsection

@section('content')


{{-- <livewire:calendar /> --}}
@livewire('calendar')



@endsection
