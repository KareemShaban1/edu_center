@extends('layouts.master')
@section('css')
<style>
    .attendance-card {
        transition: all 0.3s ease;
        margin-bottom: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #dc3545;
    }
    .attendance-card.present {
        border-left-color: #28a745;
    }
    .attendance-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }
    .attendance-header {
        padding: 15px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .attendance-status {
        padding: 5px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9rem;
    }
    .status-present {
        background-color: #d4edda;
        color: #155724;
    }
    .status-absent {
        background-color: #f8d7da;
        color: #721c24;
    }
    .attendance-body {
        padding: 15px;
    }
    .info-row {
        display: flex;
        margin-bottom: 8px;
        align-items: center;
    }
    .info-label {
        font-weight: bold;
        color: #6c757d;
        min-width: 100px;
        margin-right: 10px;
    }
    .info-value {
        flex: 1;
    }
    .notes-section {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px dashed #ddd;
    }
    .notes-label {
        font-weight: bold;
        color: #6c757d;
        margin-bottom: 5px;
        display: block;
    }
    .date-badge {
        background-color: #f8f9fa;
        padding: 3px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        color: #6c757d;
    }
    @media (max-width: 768px) {
        .info-row {
            flex-direction: column;
            align-items: flex-start;
        }
        .info-label {
            margin-bottom: 3px;
        }
    }
</style>
@endsection

@section('title')
{{ trans('Parents_Dashboard/attendance_trans.Attendance_Report') }}
@stop

@section('content')
<div class="row">
    <div class="col-12 mb-4">
        <div class="d-flex justify-content-between align-items-center">
            <h4 class="mb-0">{{ trans('Parents_Dashboard/attendance_trans.Attendance_Report') }}</h4>
            <span class="date-badge">{{ trans('Parents_Dashboard/attendance_trans.Today_Date') }}: {{ date('Y-m-d') }}</span>
        </div>
        <hr>
    </div>
</div>

<x-backend.alert />



<!-- Filter Card -->
<div class="card filter-card mb-4">
    <div class="card-header">
        <h5 class="card-title mb-0">
            <i class="fas fa-filter me-2"></i>{{ trans('Parents_Dashboard/attendance_trans.Attendance_Search') }}
        </h5>
    </div>
    <div class="card-body">
        <form method="GET" action="" class="row g-3">
            <div class="col-md-4">
                <label for="student" class="form-label">{{ trans('Parents_Dashboard/attendance_trans.Student') }}</label>
                <select class="form-select form-control" id="student" name="student_id">
                    <option value="">{{ trans('Parents_Dashboard/attendance_trans.All_Students') }}</option>
                    @foreach($students as $s)
                        <option value="{{ $s->id }}" {{ request('student_id') == $s->id ? 'selected' : '' }}>
                            {{ $s->name }} - {{ $s->grade->grade_name }} / {{ $s->class->class_name }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-3">
                <label for="start_date" class="form-label">{{ trans('Parents_Dashboard/attendance_trans.Start_Date') }}</label>
                <input type="date" class="form-control" id="start_date" name="start_date" 
                       value="{{ request('start_date') }}" max="{{ date('Y-m-d') }}">
            </div>
            <div class="col-md-3">
                <label for="end_date" class="form-label">{{ trans('Parents_Dashboard/attendance_trans.End_Date') }}</label>
                <input type="date" class="form-control" id="end_date" name="end_date" 
                       value="{{ request('end_date', date('Y-m-d')) }}" max="{{ date('Y-m-d') }}">
            </div>
            <div class="col-md-2 d-flex align-items-end gap-2">
                <button type="submit" class="btn btn-primary flex-grow-1">
                    <i class="fas fa-search me-1"></i> {{ trans('Parents_Dashboard/attendance_trans.Filter') }}
                </button>
                <a href="" class="btn btn-outline-secondary">
                    <i class="fas fa-undo"></i>
                </a>
            </div>
        </form>
    </div>
</div>

<!-- Summary Cards -->
@if(isset($summary) && $summary['total'] > 0)
<div class="row mb-4">
    <div class="col-md-4">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            {{ trans('Parents_Dashboard/attendance_trans.Total_Records') }}
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">{{ $summary['total'] }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                            {{ trans('Parents_Dashboard/attendance_trans.Presence') }}
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            {{ $summary['present'] }} 
                            <small class="text-muted">({{ $summary['present_percentage'] }}%)</small>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-check-circle fa-2x text-success"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                            {{ trans('Parents_Dashboard/attendance_trans.Absent') }}
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            {{ $summary['absent'] }}
                            @if($summary['total'] > 0)
                                <small class="text-muted">
                                    ({{ round(($summary['absent'] / $summary['total']) * 100, 2) }}%)
                                </small>
                            @endif
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-times-circle fa-2x text-danger"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endif

@if($attendances->count() > 0)
<div class="d-flex justify-content-between align-items-center mb-3">
    <div class="text-muted">
        {{ trans('common.showing') }} 
        {{ $attendances->firstItem() }} - {{ $attendances->lastItem() }} 
        {{ trans('common.of') }} {{ $attendances->total() }} 
        {{ trans_choice('common.records', $attendances->total()) }}
    </div>
    <div>
        <span class="badge bg-light text-dark me-2">
            <i class="fas fa-filter me-1"></i>
            @if(isset($filters['student_id']) && $filters['student_id'])
                {{ trans('Parents_Dashboard/attendance_trans.Student') }}: {{ $students->firstWhere('id', $filters['student_id'])->name ?? '' }}
            @else
                {{ trans('Parents_Dashboard/attendance_trans.All_Students') }}
            @endif
        </span>
        @if(isset($filters['start_date']) || isset($filters['end_date']))
            <span class="badge bg-light text-dark">
                <i class="far fa-calendar-alt me-1"></i>
                {{ $filters['start_date'] ?? '...' }} 
                <i class="fas fa-arrow-right mx-1"></i> 
                {{ $filters['end_date'] ?? now()->format('Y-m-d') }}
            </span>
        @endif
    </div>
</div>
<div class="row">
    @foreach ($attendances as $attendance)
    @php
        $isPresent = $attendance->attendance_status;
        $cardClass = $isPresent ? 'border-success' : 'border-danger';
        $statusClass = $isPresent ? 'bg-success' : 'bg-danger';
    @endphp
    <div class="col-lg-6 col-md-6 col-12 mb-4">
        <div class="card h-100 border-3 {{ $cardClass }} shadow-sm">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="fas fa-user-graduate me-2"></i>{{ $attendance->student->name }}
                </h5>
                <span class="badge {{ $statusClass }} rounded-pill text-white">
                    {{ trans('Parents_Dashboard/attendance_trans.' . ($isPresent ? 'Presence' : 'Absent')) }}
                </span>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-layer-group me-2 text-muted"></i>
                            <div>
                                <small class="text-muted">{{ trans('Parents_Dashboard/attendance_trans.Grade') }}</small>
                                <div class="fw-semibold">{{ $attendance->grade->grade_name ?? 'N/A' }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-chalkboard me-2 text-muted"></i>
                            <div>
                                <small class="text-muted">{{ trans('Parents_Dashboard/attendance_trans.Class') }}</small>
                                <div class="fw-semibold">{{ $attendance->class->class_name ?? 'N/A' }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-users me-2 text-muted"></i>
                            <div>
                                <small class="text-muted">{{ trans('Parents_Dashboard/attendance_trans.Section') }}</small>
                                <div class="fw-semibold">{{ $attendance->section->section_name ?? 'N/A' }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <i class="far fa-calendar-alt me-2 text-muted"></i>
                            <div>
                                <small class="text-muted">{{ trans('Parents_Dashboard/attendance_trans.Date') }}</small>
                                <div class="fw-semibold">{{ $attendance->attendance_date }}</div>
                            </div>
                        </div>
                    </div>
                    @if($attendance->notes)
                    <div class="col-12">
                        <div class="alert alert-light border rounded p-2 mb-0">
                            <small class="text-muted d-block mb-1">
                                <i class="fas fa-sticky-note me-1"></i>
                                {{ trans('Parents_Dashboard/attendance_trans.Notes') }}
                            </small>
                            <div class="fst-italic">{{ $attendance->notes }}</div>
                        </div>
                    </div>
                    @endif
                </div>
            </div>
            <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    {{ $attendance->created_at->diffForHumans() }}
                </small>
                <button type="button" class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" 
                        data-bs-target="#notificationModal" data-student-id="{{ $attendance->student_id }}"
                        title="{{ trans('Parents_Dashboard/attendance_trans.Notifications') }}">
                    <i class="fas fa-bell"></i>
                </button>
            </div>
        </div>
    </div>
    @endforeach
</div>

<div class="row">
    <div class="col-12">
        {{ $attendances->appends(request()->query())->links() }}
    </div>
</div>
@else
<div class="text-center py-5">
    <div class="mb-3">
        <i class="fas fa-clipboard-list fa-4x text-muted"></i>
    </div>
    <h4 class="text-muted">{{ trans('Parents_Dashboard/attendance_trans.No_attendance_records_found') }}</h4>
    <p class="text-muted">
        {{ trans('messages.no_records_available') }}
    </p>
    <a  class="btn btn-primary mt-3">
        <i class="fas fa-sync-alt me-1"></i> {{ trans('common.reset_filters') }}
    </a>
</div>
@endif

@endsection