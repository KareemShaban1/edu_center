@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/online_classes_trans.Add_Online_Class') }}
@stop
@endsection
@section('page-header')
{{ trans('admin/online_classes_trans.Add_Online_Class') }}
@endsection
@section('content')
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />

                <form method="post" action="{{ route('meetings.store') }}" autocomplete="off">
                    @csrf
                    <div class="row">
                        <div class="col-md-4 col-12">
                            <div class="form-group">
                                <label for="grade_id">{{ trans('admin/online_classes_trans.Grade') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" name="grade_id" id="grade_id">
                                    <option selected disabled>{{ trans('admin/online_classes_trans.Choose') }}...</option>
                                    @foreach ($grades as $grade)
                                        <option value="{{ $grade->id }}">{{ $grade->grade_name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <div class="col-md-4 col-12">
                            <div class="form-group">
                                <label for="class_id">{{ trans('admin/online_classes_trans.Class') }} : <span
                                        class="text-danger">*</span></label>
                                <select class="custom-select mr-sm-2" id="class_id" name="class_id">

                                </select>
                            </div>
                        </div>

                        <div class="col-md-4 col-12">
                            <div class="form-group">
                                <label for="section_id">{{ trans('admin/online_classes_trans.Section') }} : </label>
                                <select class="custom-select mr-sm-2" id="section_id" name="section_id">

                                </select>
                            </div>
                        </div>
                    </div><br>

                    <div class="row">

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="topic">{{ trans('admin/online_classes_trans.Online_Class_Title') }}<span class="text-danger">*</span></label>
                                <input class="form-control" name="topic" id="topic" type="text">
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="start_time">{{ trans('admin/online_classes_trans.Online_Class_Date') }} <span class="text-danger">*</span></label>
                                <input class="form-control" type="datetime-local" name="start_time" id="start_time">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="duration">{{ trans('admin/online_classes_trans.Online_Class_Duration') }} <span class="text-danger">*</span></label>
                                <input class="form-control" name="duration" id="duration" type="number" min="15" max="480" value="45">
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="provider">Provider <span class="text-danger">*</span></label>
                                <select class="custom-select" name="provider" id="provider">
                                    <option value="jitsi" selected>Jitsi (free / open)</option>
                                    <option value="livekit">LiveKit</option>
                                    <option value="external">External link (Zoom, Meet, …)</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="form-group">
                                <label><input type="checkbox" name="record_enabled" value="1"> Allow recording (LiveKit / metadata)</label>
                            </div>
                        </div>

                    </div>

                    <div class="row" id="external-fields" style="display:none;">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Student join URL <span class="text-danger">*</span></label>
                                <input class="form-control" name="join_url" type="text">
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Host / moderator URL</label>
                                <input class="form-control" name="moderator_url" type="text">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>External reference</label>
                                <input class="form-control" name="external_ref" type="text">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Password (optional)</label>
                                <input class="form-control" name="password" type="text">
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-success btn-sm nextBtn btn-lg pull-right"
                        type="submit">{{ trans('admin/online_classes_trans.Submit') }}</button>
                </form>

            </div>
        </div>
    </div>
</div>
@endsection
@push('scripts')
<script>
    document.getElementById('provider').addEventListener('change', function () {
        document.getElementById('external-fields').style.display = this.value === 'external' ? 'flex' : 'none';
    });
</script>
@endpush
