@extends('layouts.master')
@section('css')
    
@section('title')
    Add Weekly Series
@stop
@endsection
@section('page-header')
    Add Weekly Series
@endsection

@section('content')
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <x-backend.alert />

                <form method="post" action="{{ route('teacher_meeting_series.store') }}" autocomplete="off">
                    @csrf

                    <input type="hidden" name="grade_id" value="{{ $grade->id }}">
                    <input type="hidden" name="class_id" value="{{ $class->id }}">
                    <input type="hidden" name="section_id" value="{{ $section->id }}">

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Title <span class="text-danger">*</span></label>
                                <input class="form-control" name="topic" type="text" required>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Provider <span class="text-danger">*</span></label>
                                <select class="custom-select" name="provider" id="provider">
                                    <option value="jitsi" selected>Jitsi (free / open)</option>
                                    <option value="livekit">LiveKit</option>
                                    <option value="external">External link</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Start Date <span class="text-danger">*</span></label>
                                <input class="form-control" type="date" name="start_date" required value="{{ date('Y-m-d') }}">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>End Date</label>
                                <input class="form-control" type="date" name="end_date">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Start Time <span class="text-danger">*</span></label>
                                <input class="form-control" type="time" name="start_time" required value="10:00">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Duration (min) <span class="text-danger">*</span></label>
                                <input class="form-control" type="number" min="15" max="480" name="duration" required value="45">
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Weekly Days <span class="text-danger">*</span></label>
                                @php
                                    $days = [
                                      1 => 'Mon',
                                      2 => 'Tue',
                                      3 => 'Wed',
                                      4 => 'Thu',
                                      5 => 'Fri',
                                      6 => 'Sat',
                                      7 => 'Sun',
                                    ];
                                @endphp
                                <div class="d-flex flex-wrap gap-2">
                                    @foreach($days as $k => $label)
                                        <label class="mr-3" style="white-space:nowrap">
                                            <input type="checkbox" name="week_days[]" value="{{ $k }}" checked>
                                            {{ $label }}
                                        </label>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <div class="col-md-6" id="record-block">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="record_enabled" value="1">
                                    Allow recording (LiveKit)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3" id="external-block">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Join URL <span class="text-danger">*</span></label>
                                <input class="form-control" name="join_url" type="text">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Moderator URL</label>
                                <input class="form-control" name="moderator_url" type="text">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Password</label>
                                <input class="form-control" name="password" type="text">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>External reference</label>
                                <input class="form-control" name="external_ref" type="text">
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3" id="offline-block">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Location <span class="text-danger">*</span></label>
                                <input class="form-control" name="location" type="text">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Notes</label>
                                <input class="form-control" name="notes" type="text">
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-success btn-sm nextBtn btn-lg pull-right mt-3" type="submit">
                        Submit
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    function syncBlocks() {
        const provider = document.getElementById('provider').value;
        const externalBlock = document.getElementById('external-block');
        const offlineBlock = document.getElementById('offline-block');
        const recordBlock = document.getElementById('record-block');

        externalBlock.style.display = provider === 'external' ? 'flex' : 'none';
        offlineBlock.style.display = provider === 'offline' ? 'flex' : 'none';
        recordBlock.style.display = provider === 'livekit' ? 'block' : 'none';
    }

    document.getElementById('provider').addEventListener('change', syncBlocks);
    syncBlocks();
</script>
@endpush

