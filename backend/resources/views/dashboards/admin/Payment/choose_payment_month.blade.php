@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('admin/payment_trans.Choose_Month') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/payment_trans.Choose_Month') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <div class="row">

                    @forelse ($fees as $fee)
                        <div class="col-xl-3 col-lg-6 col-md-6 col-12 mb-30">
                            <a href="{{ route('payment.addEditPayment', [$section_id, $fee->id]) }}">
                                <div class="card card-statistics h-100">
                                    <div class="card-body">
                                        <div class="clearfix">

                                            <div style="text-align: center">
                                                <h4>{{ $fee->month }}</h4>
                                            </div>

                                            <div class="p-1">
                                                <p class="text-success"> {{ $fee->amount }} جنية</p>
                                            </div>
                                            @if ($fee->Fee_type == 0)
                                                <div class="p-1">
                                                    <p class="text-info">
                                                        {{ trans('admin/payment_trans.Month_Fees') }}
                                                    </p>
                                                </div>
                                            @elseif($fee->Fee_type == 1)
                                                <div class="p-1">
                                                    <p class="text-info">
                                                        {{ trans('admin/payment_trans.Half_Month_Fees') }}
                                                    </p>
                                                </div>
                                            @elseif($fee->Fee_type == 2)
                                                <div class="p-1">
                                                    <p class="text-info">
                                                        {{ trans('admin/payment_trans.Book_Fees') }}
                                                    </p>
                                                </div>
                                            @elseif($fee->Fee_type == 3)
                                                <div class="p-1">
                                                    <p class="text-info">
                                                        {{ trans('admin/payment_trans.Other_Fees') }}
                                                    </p>
                                                </div>
                                            @endif


                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>

                    @empty

                        <div class="col-md-12">
                            <div style="text-align: center; font-size:30px">
                                {{ trans('admin/payment_trans.There_Is_No_Fees') }}</div>
                            <div style="display: flex; justify-content: center; ">
                                <img src="{{ asset('images/icons/not_found.webp') }}" height="500" width="500"
                                    alt="">
                            </div>
                        </div>
                    @endforelse
                </div>
            </div>



        </div>
    </div>
</div>
</div>
<!-- row closed -->
@endsection
@push('scripts')
@endpush
