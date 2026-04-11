@extends('layouts.master')
@section('title', trans('Teacher_Dashboard/online_classes_trans.Add_Online_Course'))
@section('content')
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <x-backend.alert/>
                <form method="post" action="{{ route('teacher_meetings.store') }}" autocomplete="off">
                    @csrf
                    <div class="row">
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Grade') }}</label>
                            <select class="custom-select" name="grade_id" id="grade_id">
                                <option value="{{ $grade->id }}" selected>{{ $grade->grade_name }}</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Class') }}</label>
                            <select class="custom-select" name="class_id" id="class_id">
                                <option value="{{ $class->id }}" selected>{{ $class->class_name }}</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Section') }}</label>
                            <select class="custom-select" name="section_id" id="section_id">
                                <option value="{{ $section->id }}" selected>{{ $section->section_name }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Title') }}</label>
                            <input class="form-control" name="topic" required>
                        </div>
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Date_Time') }}</label>
                            <input class="form-control" type="datetime-local" name="start_time" required>
                        </div>
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Duration') }}</label>
                            <input class="form-control" name="duration" type="number" min="15" max="480" value="45" required>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-4">
                            <label>Provider</label>
                            <select class="custom-select" name="provider" id="provider">
                                <option value="jitsi">Jitsi</option>
                                <option value="livekit">LiveKit</option>
                                <option value="external">External link</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label><input type="checkbox" name="record_enabled" value="1"> Recording (LiveKit)</label>
                        </div>
                    </div>
                    <div class="row mt-3" id="external-fields" style="display:none;">
                        <div class="col-12"><input class="form-control" name="join_url" placeholder="Student join URL"></div>
                        <div class="col-12 mt-2"><input class="form-control" name="moderator_url" placeholder="Host URL"></div>
                    </div>
                    <button class="btn btn-success mt-3" type="submit">{{ trans('Teacher_Dashboard/online_classes_trans.Submit') }}</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
@push('scripts')
<script>
document.getElementById('provider').addEventListener('change', function () {
  document.getElementById('external-fields').style.display = this.value === 'external' ? 'block' : 'none';
});
</script>
@endpush
