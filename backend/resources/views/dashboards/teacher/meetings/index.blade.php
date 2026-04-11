@extends('layouts.master')
@section('title', trans('Teacher_Dashboard/online_classes_trans.Online_Courses'))
@section('content')
<div class="row">
    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <div class="table-responsive">
                    <table id="datatable" class="table table-hover table-sm table-bordered p-0" data-page-length="50" style="text-align: center">
                        <thead>
                            <tr class="alert-success">
                                <th>#</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Grade') }}</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Class') }}</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Section') }}</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Teacher') }}</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Title') }}</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Date_Time') }}</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Time') }}</th>
                                <th>Provider</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Link') }}</th>
                                <th>Host token</th>
                                <th>{{ trans('Teacher_Dashboard/online_classes_trans.Processes') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($meetings as $m)
                            <tr>
                                <td>{{ $loop->iteration }}</td>
                                <td>{{ $m->grade->grade_name }}</td>
                                <td>{{ $m->class->class_name }}</td>
                                <td>{{ $m->section->section_name }}</td>
                                <td>{{ $m->created_by }}</td>
                                <td>{{ $m->topic }}</td>
                                <td>{{ $m->start_at }}</td>
                                <td>{{ $m->duration }}</td>
                                <td>{{ $m->provider }}</td>
                                <td class="text-danger">
                                    @if($m->provider === 'offline')
                                        —
                                    @elseif($m->provider === 'livekit')
                                        —
                                    @else
                                        <a href="{{ $m->join_url }}" target="_blank">{{ trans('Teacher_Dashboard/online_classes_trans.Join_Now') }}</a>
                                    @endif
                                </td>
                                <td>
                                    @php $lk = $m->provider === 'livekit'; @endphp
                                    @if($lk)
                                    <a href="{{ route('teacher_meetings.livekit_token', $m->id) }}" target="_blank" class="small">JSON</a>
                                    @else
                                    -
                                    @endif
                                </td>
                                <td>
                                    <button type="button" class="btn btn-danger btn-sm" data-toggle="modal" data-target="#Delete_meeting{{ $m->id }}"><i class="fa fa-trash"></i></button>
                                </td>
                            </tr>
                            @include('dashboards.teacher.meetings.delete', ['m' => $m])
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
@push('scripts')
<script>
$(function(){ $('#datatable').DataTable({ responsive: true }); });
</script>
@endpush
