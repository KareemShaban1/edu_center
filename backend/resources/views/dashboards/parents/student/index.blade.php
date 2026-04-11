@extends('layouts.master')
@section('css')
<style>
    .student-card {
        transition: all 0.3s ease;
        margin-bottom: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .student-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }

    .student-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
        font-size: 2rem;
        color: #666;
    }

    .student-info {
        padding: 15px;
    }

    .student-info p {
        margin-bottom: 8px;
        font-size: 0.9rem;
    }

    .student-info p strong {
        color: #333;
        margin-left: 5px;
    }

    .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 15px;
    }

    .action-btn {
        flex: 1;
        min-width: 120px;
        margin: 3px 0;
        font-size: 0.8rem;
        padding: 5px 8px;
    }

    @media (max-width: 768px) {
        .action-buttons {
            flex-direction: column;
        }

        .action-btn {
            width: 100%;
        }
    }
</style>
@endsection


@section('content')
<div class="row">
    @foreach ($students as $student)
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-4">
        <div class="card student-card">
            <div class="card-body text-center">
                <div class="student-avatar">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <h5 class="card-title mb-3">{{ $student->name }}</h5>

                <div class="student-info text-left">
                    <p><i class="fas fa-envelope text-primary"></i> <strong>{{ trans('Parents_Dashboard/reports_trans.Email') }}:</strong> {{ $student->email }}</p>
                    <p><i class="fas fa-venus-mars text-info"></i> <strong>{{ trans('Parents_Dashboard/reports_trans.Gender') }}:</strong> {{ $student->gender }}</p>
                    <p><i class="fas fa-graduation-cap text-success"></i> <strong>{{ trans('Parents_Dashboard/reports_trans.Grade') }}:</strong> {{ $student->grade->grade_name }}</p>
                    <p><i class="fas fa-chalkboard text-warning"></i> <strong>{{ trans('Parents_Dashboard/reports_trans.Class') }}:</strong> {{ $student->class->class_name }}</p>
                    <p><i class="fas fa-chalkboard-teacher text-danger"></i> <strong>{{ trans('Parents_Dashboard/reports_trans.Section') }}:</strong> {{ $student->section->section_name }}</p>
                </div>

                <div class="action-buttons">
                    <a href="{{ route('sons.student_attendance', $student->id) }}" class="btn btn-sm btn-outline-success action-btn">
                        <i class="far fa-calendar-check"></i> {{ trans('Parents_Dashboard/reports_trans.Attendance_Report') }}
                    </a>
                    <a href="{{ route('sons.student_payment', $student->id) }}" class="btn btn-sm btn-outline-primary action-btn">
                        <i class="fas fa-money-bill-wave"></i> {{ trans('Parents_Dashboard/reports_trans.Payment_Report') }}
                    </a>
                    <a href="{{ route('sons.student_quiz', $student->id) }}" class="btn btn-sm btn-outline-warning action-btn">
                        <i class="fas fa-tasks"></i> {{ trans('Parents_Dashboard/reports_trans.Quiz_Report') }}
                    </a>
                    <a href="{{ route('sons.student_exam', $student->id) }}" class="btn btn-sm btn-outline-info action-btn">
                        <i class="fas fa-file-alt"></i> {{ trans('Parents_Dashboard/reports_trans.Exams_Report') }}
                    </a>
                </div>
            </div>
        </div>
    </div>
    @endforeach
</div>
@endsection