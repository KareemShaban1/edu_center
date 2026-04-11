@extends('layouts.master')

@section('title')
{{ trans('Student_Dashboard/student_trans.Fees') }}
@stop

@section('page-header')
{{ trans('Student_Dashboard/student_trans.Fees') }}
@endsection

@section('content')
<div class="card">

    <div class="card-header bg-[#2C3E50] text-white">
        <!-- Filters -->
        <div class="mb-4">
            <div class="row g-3">
                <div class="col-md-3">
                    <label for="filterStartDate" class="form-label">{{ __('Start Date') }}</label>
                    <input type="date" id="filterStartDate" class="form-control">
                </div>
                <div class="col-md-3">
                    <label for="filterEndDate" class="form-label">{{ __('End Date') }}</label>
                    <input type="date" id="filterEndDate" class="form-control">
                </div>
                <div class="col-md-3">
                    <label for="filterMonthYear" class="form-label">{{ __('Month') }}</label>
                    <input type="month" id="filterMonthYear" class="form-control">
                </div>
                <div class="col-md-3 d-flex align-items-end">
                    <button id="applyFilters" class="btn btn-primary w-100">
                        <i class="fas fa-filter"></i> {{ __('Filters') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="card-body">



        <!-- Payment Cards -->
        <div id="paymentList" class="row g-3">
            <!-- Cards will be rendered dynamically -->
        </div>

        <!-- Loader -->
        <div id="loadingSpinner" class="text-center d-none mt-4">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    function fetchPayments(filters = {}) {
        $('#loadingSpinner').removeClass('d-none');
        $('#paymentList').empty();

        $.ajax({
            url: '{{ route("student.payment", $student_id ?? 0) }}',
            type: 'GET',
            data: filters,
            success: function(response) {
                $('#loadingSpinner').addClass('d-none');

                if (response.data.length === 0) {
                    $('#paymentList').html(`
                        <div class="col-12 text-center text-muted">
                            {{ __('No payments found.') }}
                        </div>
                    `);
                    return;
                }

                response.data.forEach(function(payment) {
                    let statusClass = payment.payment_status === 1 ? 'text-success fw-bold' : 'text-danger fw-bold';

                    $('#paymentList').append(`
                        <div class="col-md-6 col-lg-3">
                            <div class="card shadow-lg border-4 h-100">
                                <div class="card-body">
                                    <h5 class="card-title text-primary">${payment.student_name}</h5>
                                   
                                    <p class="mb-1 text-yellow-600"> ${payment.month}</p>
                                    <p class="mb-1"><strong>{{ __('Date:') }}</strong> ${payment.payment_date}</p>
                                    <p class="mb-0"><strong>{{ __('Status:') }}</strong> 
                                        <span class="${statusClass}">${payment.payment_status == 1 ? "{{ __('Paid') }}" : "{{ __('Not Paid') }}"}</span>
                                    </p>
                                    <p class="mb-0"><strong>{{ __('Amount:') }}</strong> ${payment.amount}</p>
                                    <p class="mb-0"><strong>{{ __('Notes:') }}</strong> ${payment.notes ?? ''}</p>
                                </div>
                            </div>
                        </div>
                    `);
                });
            },
            error: function() {
                $('#loadingSpinner').addClass('d-none');
                $('#paymentList').html(`
                    <div class="col-12 text-center text-danger">
                        {{ __('Failed to load payments.') }}
                    </div>
                `);
            }
        });
    }

    $(document).ready(function() {
        fetchPayments();

        $('#applyFilters').on('click', function() {
            const filters = {
                start_date: $('#filterStartDate').val(),
                end_date: $('#filterEndDate').val(),
                month_year: $('#filterMonthYear').val()
            };
            fetchPayments(filters);
        });
    });
</script>
@endpush