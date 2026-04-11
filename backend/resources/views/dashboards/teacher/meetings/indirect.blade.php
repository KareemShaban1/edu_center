@extends('layouts.master')
@section('title', trans('Teacher_Dashboard/online_classes_trans.Add_Online_Class'))
@section('content')
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <x-backend.alert />
                <form method="post" action="{{ route('indirect.teacher.store') }}" autocomplete="off">
                    @csrf
                    <div class="row">
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Grade') }}</label>
                            <select class="custom-select" name="grade_id" id="grade_id">
                                <option selected disabled>{{ trans('Parent_trans.Choose') }}...</option>
                                @foreach ($grades as $grade)
                                <option value="{{ $grade->id }}">{{ $grade->grade_name }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Class') }}</label>
                            <select class="custom-select" name="class_id" id="class_id"></select>
                        </div>
                        <div class="col-md-4">
                            <label>{{ trans('Teacher_Dashboard/online_classes_trans.Section') }}</label>
                            <select class="custom-select" name="section_id" id="section_id"></select>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-4"><input class="form-control" name="topic" placeholder="Title" required></div>
                        <div class="col-md-4"><input class="form-control" type="datetime-local" name="start_time" required></div>
                        <div class="col-md-4"><input class="form-control" name="duration" type="number" min="15" max="480" value="45" required></div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-4">
                            <label>Provider</label>
                            <select class="custom-select" name="provider" id="provider">
                                <option value="external">External link</option>
                                <option value="jitsi">Jitsi</option>
                                <option value="livekit">LiveKit</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mt-3" id="ext-only">
                        <div class="col-md-6"><input class="form-control" name="moderator_url" placeholder="Host URL"></div>
                        <div class="col-md-6"><input class="form-control" name="join_url" placeholder="Student join URL"></div>
                    </div>
                    <button class="btn btn-success mt-3" type="submit">{{ trans('Students_trans.submit') }}</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
@push('scripts')
<script>
document.getElementById('provider').addEventListener('change', function () {
  document.getElementById('ext-only').style.display = this.value === 'external' ? 'flex' : 'none';
});
</script>
@endpush
