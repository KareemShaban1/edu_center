@extends('layouts.master')
@section('title')
{{ trans('Student_Dashboard/student_trans.Exams') }}
@stop


@section('page-header')
{{ trans('Student_Dashboard/student_trans.Exams') }}
@endsection

@section('content')
<div class="card">
    <div class="card-header bg-[#2C3E50] text-white">
        <!-- <h5 style="font-family: 'Cairo', sans-serif; color: red">
            {{ trans('Student_Dashboard/student_trans.Today_Date') }}: {{ date('Y-m-d') }}
        </h5> -->

        <!-- Filters -->
        <div class="row mb-4">
            <div class="col-md-3">
                <label for="start_date" class="form-label">{{ trans('Student_Dashboard/student_trans.Start_Date') }}</label>
                <input type="date" id="start_date" class="form-control" placeholder="{{ trans('Student_Dashboard/student_trans.Start_Date') }}">
            </div>
            <div class="col-md-3">
                <label for="end_date" class="form-label">{{ trans('Student_Dashboard/student_trans.End_Date') }}</label>
                <input type="date" id="end_date" class="form-control" placeholder="{{ trans('Student_Dashboard/student_trans.End_Date') }}">
            </div>
            <div class="col-md-3">
                <label for="month_year" class="form-label">{{ trans('Student_Dashboard/student_trans.Month') }}</label>
                <input type="month" id="month_year" class="form-control" placeholder="{{ trans('Student_Dashboard/student_trans.Month') }}">
            </div>
            <div class="col-md-3">
                <button id="filterBtn" class="btn btn-primary w-100">{{ trans('Student_Dashboard/student_trans.Filter') }}</button>
            </div>
        </div>
    </div>
    <div class="card-body">
        <!-- Exams Container -->
        <div id="examContainer">
            @include('dashboards.student.exam.partials.exam_cards', ['exams' => $exams])
        </div>

    </div>
</div>



@push('scripts')
<script>
    $(document).ready(function() {
        $('#filterBtn').on('click', function() {
            let start_date = $('#start_date').val();
            let end_date = $('#end_date').val();
            let month_year = $('#month_year').val();

            $.ajax({
                url: "{{ route('student.exam', $student_id) }}",
                type: "GET",
                data: {
                    start_date: start_date,
                    end_date: end_date,
                    month_year: month_year
                },
                beforeSend: function() {
                    $('#examContainer').html('<div class="col-12 text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i></div>');
                },
                success: function(response) {
                    $('#examContainer').html(response.html);
                },
                error: function() {
                    alert('Something went wrong!');
                }
            });
        });
    });
</script>
@endpush

@endsection