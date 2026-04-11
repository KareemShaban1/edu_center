@extends('layouts.master')
@section('title', trans('Teacher_Dashboard/online_classes_trans.Online_Courses'))
@section('content')
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <x-backend.alert />
            <div class="card-body">
                <div class="accordion gray plus-icon round">
                    @foreach ($grades as $grade)
                    <div class="acd-group">
                        <a href="#" class="acd-heading">{{ $grade->grade_name }}</a>
                        <div class="row">
                            <div class="col-xl-12 mb-30">
                                <div class="table-responsive mt-15">
                                    <table class="table center-aligned-table mb-0">
                                        <thead>
                                            <tr class="text-dark">
                                                <th>#</th>
                                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Section_Name') }}</th>
                                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Class_Name') }}</th>
                                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Number_Of_Students') }}</th>
                                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Status') }}</th>
                                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Processes') }}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($grade->sections as $section)
                                            <tr>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $section->section_name }}</td>
                                                <td>{{ $section->class->class_name }}</td>
                                                <td>{{ $section->students->count() }}</td>
                                                <td>
                                                    <span class="badge badge-{{ $section->status == 1 ? 'success' : 'danger' }}">{{ $section->status == 1 ? 'Active' : 'Inactive' }}</span>
                                                </td>
                                                <td>
                                                    <a href="{{ route('teacher_meetings.create', $section->id) }}" class="btn btn-warning btn-sm">{{ trans('Teacher_Dashboard/online_classes_trans.Add_Online_Course') }}</a>
                                                </td>
                                            </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
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
@endsection
