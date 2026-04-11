@extends('layouts.master')
@section('css')
    
@section('title')
{{ trans('Student_Dashboard/student_trans.Online_Classes') }}
@stop
@endsection
@section('page-header')
    {{ trans('Student_Dashboard/student_trans.Online_Classes') }}
@endsection
@section('content')
    <x-backend.alert/>

    
    <h5 style="font-family: 'Cairo', sans-serif;color: red"> {{ trans('Student_Dashboard/student_trans.Today_Date') }}: {{ date('Y-m-d') }}</h5>
    <div class="table-responsive">
        <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                style="text-align: center">
            <thead>
            <tr>
                <th class="alert-success">#</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Online_Classes_Title') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Date_Time') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Grade') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Class') }}</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Section') }}</th>
                <th class="alert-success">Provider</th>
                <th class="alert-success">{{ trans('Student_Dashboard/student_trans.Processes') }}</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($meetings as $meeting)
                <tr>
                    <td>{{ $loop->index + 1 }}</td>
                    <td>{{ $meeting->topic}}</td>
                    <td>{{ $meeting->start_at}}</td>
                    <td>{{ $meeting->grade->grade_name }}</td>
                    <td>{{ $meeting->class->class_name }}</td>
                    <td>{{ $meeting->section->section_name }}</td>
                    <td>{{ $meeting->provider }}</td>
                    <td class="text-danger">
                        @if($meeting->provider === 'livekit')
                            <span class="small">Use student app LiveKit join</span>
                        @else
                            <a href="{{ $meeting->join_url }}" target="_blank">
                            {{ trans('Student_Dashboard/student_trans.Join_Now') }}
                            </a>
                        @endif
                    </td>
            </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endsection
@push('scripts')    
    <script>
        $(document).ready(function() {
            $('#datatable').DataTable({
                responsive: true,
                columnDefs: [{
                        responsivePriority: 1,
                        targets: 1
                    },
                    {
                        responsivePriority: 2,
                        targets: 2
                    },
                    {
                        responsivePriority: 3,
                        targets: 5
                    },
                    {
                        responsivePriority: 4,
                        targets: 6
                    },
                ],
            });
        });
    </script>
@endpush
