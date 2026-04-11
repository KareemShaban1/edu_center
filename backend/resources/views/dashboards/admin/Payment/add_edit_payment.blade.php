@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/payment_trans.Students_List') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/payment_trans.Students_List') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->

<x-backend.alert />


<h5 style="font-family: 'Cairo', sans-serif;color: red"> {{ trans('admin/payment_trans.Today_Date') }}
    {{ carbon\Carbon::now('Egypt')->format('Y-m-d') }}
</h5>

<div style="margin-bottom: 30px; color:rgb(164, 16, 16); font-weight:bold">
    {{ $fee->grade->grade_name }} / {{ $fee->class->class_name }} / {{ $fee->section->section_name }}
</div>

<form method="post" action="{{ route('payment.storeUpdatePayment') }}">

    <div class="form-row">

        <div class="form-group col-md-4">
            <label>{{ trans('admin/payment_trans.Fees') }}</label>
            <select class="custom-select mr-sm-2" name="fee_id">
                <option value="{{ $fee->id }}" selected>{{ $fee->title }}</option>
            </select>
        </div>

        <div class="form-group col-md-4">
            <label>{{ trans('admin/payment_trans.Amount') }}</label>
            <select class="custom-select mr-sm-2" name="amount">
                <option value="{{ $fee->amount }}" selected>{{ $fee->amount }}</option>
            </select>
        </div>

        <div class="form-group col-md-4">
            <label>{{ trans('admin/payment_trans.Month') }}</label>
            <select class="custom-select mr-sm-2" name="month">
                <option value="{{ $fee->month }}" selected>{{ $fee->month }}</option>
            </select>
        </div>


    </div>

    @csrf

    <div class="table-responsive">
        <table id="paymentTable" class="table  table-hover table-sm nowrap table-bordered p-0 m-0" data-page-length="50"
            style="text-align: center">
            <thead>
                <tr>
                    <th class="alert-success">#</th>
                    <th class="alert-success">{{ trans('admin/payment_trans.Student_Name') }}</th>
                    <th class="alert-success">{{ trans('admin/payment_trans.Amount') }}</th>
                    <th class="alert-success">{{ trans('admin/payment_trans.Payment_Date') }}</th>
                    <th class="alert-success">{{ trans('admin/payment_trans.Notes') }}</th>
                    <th class="alert-success">{{ trans('admin/payment_trans.Processes') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($students as $student)
                <?php
                $student_payment = $student
                    ->payment()
                    ->where('month', $fee->month)
                    ->where('student_id', $student->id)
                    ->where('section_id', $student->section_id)
                    ->first(); ?>

                <tr>
                    <input type="hidden" name="student_id[]" value="{{ $student->id }}">
                    <input type="hidden" name="grade_id" value="{{ $student->grade_id }}">
                    <input type="hidden" name="class_id" value="{{ $student->class_id }}">
                    <input type="hidden" name="section_id" value="{{ $student->section_id }}">

                    <td>{{ $loop->index + 1 }}</td>
                    <td>{{ $student->name }}</td>
                    <td>
                        <input type="text" name="payment_amount[{{ $student->id }}]"
                            class="form-control"
                            value="{{ $student_payment->amount ?? $fee->amount}}">
                    </td>
                    <td>
                        <input type="date" name="payment_dates[{{ $student->id }}]"
                            class="form-control"
                            value="{{ $student_payment->payment_date ?? \Carbon\Carbon::now('Egypt')->format('Y-m-d') }}">
                    </td>
                    <td>
                        <input type="text" name="payment_notes[{{ $student->id }}]"
                            value="{{ old('notes[]',  $student_payment->notes ?? '' )}}"
                            class="form-control">
                    </td>
                    <td>

                        @if (isset($student_payment))
                        <label style="display: block" class="text-gray-500 font-semibold sm:border-r sm:pr-4">
                            <input name="payments[{{ $student->id }}]" {{-- disabled --}}
                                {{ $student_payment->payment_status == 1 ? 'checked' : '' }}
                                class="leading-tight" type="radio" value="true">
                            <span class="text-success">{{ trans('admin/payment_trans.Paid') }}</span>
                        </label>

                        <label style="display: block" class=" text-gray-500 font-semibold">
                            <input name="payments[{{ $student->id }}]" {{-- disabled --}}
                                {{ $student_payment->payment_status == 0 ? 'checked' : '' }}
                                class="leading-tight" type="radio" value="false">
                            <span
                                class="text-danger">{{ trans('admin/payment_trans.Not_Paid') }}</span>
                        </label>
                        @else
                        <label style="display: block" class=" text-gray-500 font-semibold sm:border-r sm:pr-4">
                            <input name="payments[{{ $student->id }}]" class="leading-tight" type="radio"
                                value="true">
                            <span class="text-success"> {{ trans('admin/payment_trans.Paid') }}
                            </span>
                        </label>

                        <label style="display: block" class=" text-gray-500 font-semibold">
                            <input name="payments[{{ $student->id }}]" class="leading-tight" type="radio"
                                value="false">
                            <span
                                class="text-danger">{{ trans('admin/payment_trans.Not_Paid') }}</span>
                        </label>
                        @endif



                    </td>
                </tr>

                @endforeach
            </tbody>
        </table>

        <button class="btn btn-success" type="submit">{{ trans('admin/payment_trans.Submit') }}</button>
    </div>
</form><br>
<!-- row closed -->
@endsection
@push('scripts')
<script>
    $(document).ready(function() {
        $('#paymentTable').DataTable({
            responsive: true,
            searching: true, // Enable global search box
           
            columnDefs: [
                { responsivePriority: 1, targets: 1 },
                { responsivePriority: 2, targets: 5 }
            ]
        });
    });
</script>


@endpush