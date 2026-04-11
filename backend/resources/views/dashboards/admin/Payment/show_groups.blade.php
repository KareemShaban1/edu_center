@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/payment_trans.Section_Payment') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/payment_trans.Section_Payment') }}
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">


            <x-backend.alert />

            <div class="card card-statistics h-100">
                <div class="card-body">
                    <div class="accordion gray plus-icon round">

                        @foreach ($grades as $grade)
                            <div class="acd-group">
                                <a href="#" class="acd-heading">{{ $grade->grade_name }}</a>


                                <div class="row">
                                    <div class="col-xl-12 mb-30">
                                        <div class="card card-statistics h-100">
                                            <div class="card-body">
                                                <div class="d-block d-md-flex justify-content-between">
                                                    <div class="d-block">
                                                    </div>
                                                </div>
                                                <div class="table-responsive mt-15">
                                                    <table class="table center-aligned-table mb-0">
                                                        <thead>
                                                            <tr class="text-dark">
                                                                <th>#</th>
                                                                <th>{{ trans('admin/payment_trans.Section') }}
                                                                </th>
                                                                <th>{{ trans('admin/payment_trans.Number_Of_Students') }}
                                                                <th>{{ trans('admin/payment_trans.Class') }}
                                                                </th>
                                                                <th>{{ trans('admin/payment_trans.Status') }}
                                                                </th>
                                                                <th>{{ trans('admin/payment_trans.Processes') }}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <?php $i = 0; ?>
                                                            @foreach ($grade->sections as $section)
                                                                <tr>
                                                                    <?php $i++; ?>
                                                                    <td>{{ $i }}</td>
                                                                    <td>{{ $section->section_name }}</td>
                                                                    <td>{{ $section->students()->count() }}</td>
                                                                    <td>{{ $section->class->class_name }}</td>
                                                                    <td>
                                                                        <label
                                                                            class="badge badge-{{ $section->status == 1 ? 'success' : 'danger' }}">
                                                                            {{ $section->status == 1
                                                                                ? trans('admin/sections_trans.Active')
                                                                                : trans('admin/sections_trans.Inactive') }}</label>
                                                                    </td>

                                                                    <td>
                                                                        <a href="{{ route('payment.choosePaymentMonth', $section->id) }}"
                                                                            class="btn btn-warning btn-sm"
                                                                            role="button" aria-pressed="true">
                                                                            {{ trans('admin/payment_trans.Choose_Month') }}
                                                                        </a>
                                                                    </td>



                                                                </tr>
                                                            @endforeach
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @endforeach

                    </div>
                </div>


            </div>
        </div>
    </div>
    <!-- row closed -->
@endsection
@push('scripts')
    <script>
        $(document).ready(function() {
            $('select[name="Grade_id"]').on('change', function() {
                var Grade_id = $(this).val();
                if (Grade_id) {
                    $.ajax({
                        url: "{{ URL::to('classes') }}/" + Grade_id,
                        type: "GET",
                        dataType: "json",
                        success: function(data) {
                            $('select[name="Class_id"]').empty();
                            $.each(data, function(key, value) {
                                $('select[name="Class_id"]').append('<option value="' +
                                    key + '">' + value + '</option>');
                            });
                        },
                    });
                } else {
                    console.log('AJAX load did not work');
                }
            });
        });
    </script>

@endpush
