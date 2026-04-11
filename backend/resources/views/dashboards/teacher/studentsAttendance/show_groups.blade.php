@extends('layouts.master')
@section('css')
    

    @section('title')
        {{ trans('Teacher_Dashboard/attendance_trans.Sections_Attendance') }}
    @stop

@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('Teacher_Dashboard/attendance_trans.Sections_Attendance') }}
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
                                                                    <th>{{ trans('Teacher_Dashboard/attendance_trans.Section') }}</th>
                                                                    <th>{{ trans('Teacher_Dashboard/attendance_trans.Class') }}</th>
                                                                    <th>{{ trans('Teacher_Dashboard/attendance_trans.Number_Of_Students') }}</th>
                                                                    <th>{{ trans('Teacher_Dashboard/attendance_trans.Status') }}</th>
                                                                    <th>{{ trans('Teacher_Dashboard/attendance_trans.Processes') }}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <?php $i = 0; ?>
                                                                @foreach ($grade->sections as $section)
                                                                    <tr>
                                                                        <?php $i++; ?>
                                                                        <td>{{ $i }}</td>

                                                                        <td>{{ $section->section_name }}</td>
                                                                        <td>{{ $section->class->class_name }}</td>
                                                                        <td>{{ $section->students->count() }}</td>
                                                                        <td>
                                                                            <label
                                                                                class="badge badge-{{ $section->status == 1 ? 'success' : 'danger' }}">{{ $section->status == 1 ? 'نشط' : 'غير نشط' }}</label>
                                                                        </td>

                                                                        <td>
                                                                            <a href="{{ route('teacher_dashboard.attendanceShow', $section->id) }}"
                                                                                class="btn btn-warning btn-sm"
                                                                                role="button" aria-pressed="true">
                                                                                {{ trans('Teacher_Dashboard/attendance_trans.Students_List') }}
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
