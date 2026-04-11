@extends('layouts.master')

@section('title', trans('admin/homework_trans.Homeworks'))

@section('page-header')
{{ trans('admin/homework_trans.Homeworks') }}
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

        <!-- Homework List -->
        <div id="homeworkList" class="row g-3">
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
    function fetchHomeworks(filters = {}) {
        $('#loadingSpinner').removeClass('d-none');
        $('#homeworkList').empty();

        $.ajax({
            url: '{{ route("student.student_homework") }}',
            type: 'GET',
            data: filters,
            success: function(response) {
                $('#loadingSpinner').addClass('d-none');

                if (response.data.length === 0) {
                    $('#homeworkList').html(`
                        <div class="col-12 text-center text-muted">
                            {{ __('No homeworks found.') }}
                        </div>
                    `);
                    return;
                }

                response.data.forEach(function(hw) {
                    $('#homeworkList').append(`
                        <div class="col-md-6 col-lg-3">
                            <div class="card shadow-lg border-4 h-100">
                                <div class="card-body">
                                    <h5 class="card-title">${hw.title}</h5>
                                    <p class="card-text mb-1"><strong>{{ __('Submit Date:') }}</strong> ${hw.submit_date}</p>
                                    <p class="card-text mb-3"><strong>{{ __('Due Date:') }}</strong> ${hw.due_date}</p>
                                    <a href="/student_homework/view/${hw.id}" class="btn btn-sm btn-info">
                                        {{ trans('admin/homework_trans.Submit_Homework') }}
                                    </a>
                                </div>
                            </div>
                        </div>
                    `);
                });
            },
            error: function() {
                $('#loadingSpinner').addClass('d-none');
                $('#homeworkList').html(`
                    <div class="col-12 text-center text-danger">
                        {{ __('Failed to load homeworks.') }}
                    </div>
                `);
            }
        });
    }

    $(document).ready(function() {
        // Initial fetch
        fetchHomeworks();

        // Apply filters
        $('#applyFilters').on('click', function() {
            const filters = {
                start_date: $('#filterStartDate').val(),
                end_date: $('#filterEndDate').val(),
                month_year: $('#filterMonthYear').val()
            };
            fetchHomeworks(filters);
        });
    });
</script>
@endpush