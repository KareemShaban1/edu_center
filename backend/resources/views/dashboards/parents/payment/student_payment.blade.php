@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('Parents_Dashboard/reports_trans.Payment_Report') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('Parents_Dashboard/reports_trans.Payment_Report') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->

<x-backend.alert />



<h5 style="font-family: 'Cairo', sans-serif;color: red"> {{ trans('Parents_Dashboard/reports_trans.Today_Date') }}:
    {{ date('Y-m-d') }}</h5>

<div class="table-responsive">
    <table id="datatable" class="table nowrap table-hover table-sm table-bordered p-0" data-page-length="50"
        style="text-align: center">
        <thead>
            <tr>
                <th class="alert-danger">#</th>
                <th class="alert-danger">{{ trans('Parents_Dashboard/reports_trans.Student_Name') }}</th>
                <th class="alert-danger">{{ trans('Parents_Dashboard/reports_trans.Grade') }}</th>
                <th class="alert-danger">{{ trans('Parents_Dashboard/reports_trans.Class') }}</th>
                <th class="alert-danger">{{ trans('Parents_Dashboard/reports_trans.Section') }}</th>
                <th class="alert-danger">{{ trans('Parents_Dashboard/reports_trans.Payment_Date') }}</th>
                <th class="alert-danger">{{ trans('Parents_Dashboard/reports_trans.Amount') }}</th>
                <th class="alert-danger">{{ trans('Parents_Dashboard/reports_trans.Payment_Status') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($payments as $payment)
                <tr>
                    <td>{{ $loop->index + 1 }}</td>
                    <td>{{ $payment->student->name }}</td>
                    <td>{{ $payment->grade->grade_name }}</td>
                    <td>{{ $payment->class->class_name }}</td>
                    <td>{{ $payment->section->section_name }}</td>
                    <td>{{ $payment->month }}</td>
                    <td>{{ $payment->amount }}</td>
                    <td>
                        @if ($payment->payment_status == 1)
                            <span class="text-success">
                                {{ trans('Parents_Dashboard/reports_trans.Paid') }}
                            </span>
                        @else
                            <span class="text-danger">
                                {{ trans('Parents_Dashboard/reports_trans.Not_Paid') }}
                            </span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

</div>
<!-- row closed -->
@endsection
@push('scripts')
<script>
    $(document).ready(function() {
        $('#datatable').DataTable({
        responsive: true,
        columnDefs: [
          { responsivePriority: 1, targets: 1 }, //  highest priority
          { responsivePriority: 2, targets: 5 }, //  lower priority
          { responsivePriority: 3, targets: 6 }, //  even lower priority
          { responsivePriority: 4, targets: 7 }, //  even lower priority
          // Add more columnDefs for other columns, if needed
        ],
        });
    });
</script>
@endpush
