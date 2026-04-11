@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('Student_Dashboard/student_trans.Announcements') }}
@stop
@endsection

@section('page-header')
    <!-- breadcrumb -->
    {{ trans('Student_Dashboard/student_trans.Announcements') }}
    <!-- breadcrumb -->
@endsection

@section('content')
<x-backend.alert />

<div class="container">

 <div class="card">
    <div class="card-header bg-[#2C3E50] text-white">

            <form id="filterForm" class="row g-3 mb-4">
                <div class="col-md-3">
                    <label for="start_date" class="form-label">{{ __('Start Date') }}</label>
                    <input type="date" name="start_date" id="start_date" class="form-control">
                </div>

                <div class="col-md-3">
                    <label for="end_date" class="form-label">{{ __('End Date') }}</label>
                    <input type="date" name="end_date" id="end_date" class="form-control">
                </div>

                <div class="col-md-3">
                    <label for="month_year" class="form-label">{{ __('Month / Year') }}</label>
                    <input type="month" name="month_year" id="month_year" class="form-control">
                </div>

                <div class="col-md-3 d-flex align-items-end">
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fa fa-filter"></i> {{ __('Filter') }}
                    </button>
                </div>
            </form>
        </div>


    <div class="card-body">
        <div id="announcementsContainer" class="row g-3">
            @include('dashboards.student.announcements.partials.announcement_cards', ['announcements' => $announcements])
        </div>
    </div>
 </div>

   
</div>
@endsection

@push('scripts')
<script>
$(document).ready(function () {
    $('#filterForm').on('submit', function (e) {
        e.preventDefault();

        $.ajax({
            url: "{{ route('student.announcements.filter', $student_id) }}",
            type: "GET",
            data: $(this).serialize(),
            beforeSend: function() {
                $('#announcementsContainer').html('<div class="col-12 text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i></div>');
            },
            success: function (response) {
                $('#announcementsContainer').html(response.html);
            },
            error: function () {
                alert("Something went wrong while fetching books!");
            }
        });
    });
});
</script>
@endpush
