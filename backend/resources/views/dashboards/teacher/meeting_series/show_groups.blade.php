@extends('layouts.master')
@section('css')
    
@section('title')
    Weekly Series
@stop
@endsection
@section('page-header')
    Weekly Series
@endsection

@section('content')
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <x-backend.alert/>

            <div class="card-body">
                <div class="accordion gray plus-icon round">
                    @foreach ($grades as $grade)
                        <div class="acd-group">
                            <a href="#" class="acd-heading">{{ $grade->grade_name }}</a>
                            <div class="row">
                                <div class="col-xl-12 mb-30">
                                    <div class="card card-statistics h-100">
                                        <div class="card-body">
                                            <div class="table-responsive mt-15">
                                                <table class="table center-aligned-table mb-0">
                                                    <thead>
                                                        <tr class="text-dark">
                                                            <th>#</th>
                                                            <th>Section</th>
                                                            <th>Class</th>
                                                            <th>Students</th>
                                                            <th>Status</th>
                                                            <th>Action</th>
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
                                                                    <label class="badge badge-{{ $section->status == 1 ? 'success' : 'danger' }}">
                                                                        {{ $section->status == 1 ? 'نشط' : 'غير نشط' }}
                                                                    </label>
                                                                </td>
                                                                <td>
                                                                    <a href="{{ route('teacher_meeting_series.create', $section->id) }}"
                                                                        class="btn btn-warning btn-sm" role="button">
                                                                        Add Weekly Series
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
@endsection

