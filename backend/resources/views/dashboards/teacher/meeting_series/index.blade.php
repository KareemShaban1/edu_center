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
    <div class="col-xl-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <a href="{{ route('teacher_meeting_series.show_groups') }}" class="btn btn-success" role="button">
                    Add Weekly Series
                </a>

                <div class="table-responsive mt-3">
                    <table id="datatable" class="table table-hover table-sm table-bordered p-0" style="text-align:center">
                        <thead>
                            <tr class="alert-success">
                                <th>#</th>
                                <th>Title</th>
                                <th>Provider</th>
                                <th>Week Days</th>
                                <th>Start</th>
                                <th>Time</th>
                                <th>Duration</th>
                                <th>Location / Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($series as $s)
                                <tr>
                                    <td>{{ $loop->iteration }}</td>
                                    <td>{{ $s->topic }}</td>
                                    <td>{{ $s->provider }}</td>
                                    <td>
                                        @php
                                            $map = [1=>'Mon',2=>'Tue',3=>'Wed',4=>'Thu',5=>'Fri',6=>'Sat',7=>'Sun'];
                                            $days = $s->week_days ?: [];
                                        @endphp
                                        {{ collect($days)->map(fn($d)=>$map[$d] ?? $d)->implode(', ') }}
                                    </td>
                                    <td>{{ $s->start_date }}{{ $s->end_date ? ' → '.$s->end_date : '' }}</td>
                                    <td>{{ $s->start_time }}</td>
                                    <td>{{ $s->duration }} min</td>
                                    <td>
                                        @if($s->provider === 'offline')
                                            {{ $s->location ?: '—' }}
                                        @else
                                            {{ $s->notes ?: '—' }}
                                        @endif
                                    </td>
                                    <td>
                                        <button type="button" class="btn btn-danger btn-sm"
                                            data-toggle="modal"
                                            data-target="#Delete_series{{ $s->id }}">
                                            <i class="fa fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                @include('dashboards.teacher.meeting_series.delete', ['s' => $s])
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
    $(document).ready(function() {
        $('#datatable').DataTable({
            responsive: true
        });
    });
</script>
@endpush

