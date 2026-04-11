@extends('layouts.master')
@section('css')
@section('title')
{{ trans('admin/payment_trans.students_report') }}
@stop
@endsection
@section('page-header')
{{ trans('admin/payment_trans.students_report') }}
@endsection

@section('content')

@php
$today = \Carbon\Carbon::now()->toDateString();
$endOfMonth = \Carbon\Carbon::now()->endOfMonth()->toDateString();
@endphp

<form id="filter-form" class="mb-4">
    <div class="row">
        <div class="col-md-3">
            <label>{{ __('From Date') }}</label>
            <input type="date" name="from" class="form-control" value="{{ request('from', $today) }}" required>
        </div>
        <div class="col-md-3">
            <label>{{ __('To Date') }}</label>
            <input type="date" name="to" class="form-control" value="{{ request('to', $endOfMonth) }}" required>
        </div>
        <div class="col-md-3 align-self-end">
            <button type="submit" class="btn btn-primary mt-2">{{ __('Filter') }}</button>
            <button type="button" id="clear-filter" class="btn btn-secondary mt-2">{{ __('Clear') }}</button>
        </div>
    </div>
</form>


<!-- Results -->
<div id="report-results">
    <div class="row">
        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
            <div class="card card-statistics h-100">
                <div class="card-body text-left">
                    <p class="card-text text-dark">{{ __('Number of Students') }}</p>
                    <h4 id="students-count">{{ $section->students_count }}</h4>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
            <div class="card card-statistics h-100">
                <div class="card-body text-left">
                    <p class="card-text text-dark">{{ __('Paid Students') }}</p>
                    <h4 id="paid-students">{{ $payments->count() }}</h4>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
            <div class="card card-statistics h-100">
                <div class="card-body text-left">
                    <p class="card-text text-dark">{{ __('Unpaid Students') }}</p>
                    <h4 id="unpaid-students">{{ $section->students_count - $payments->count() }}</h4>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
            <div class="card card-statistics h-100">
                <div class="card-body text-left">
                    <p class="card-text text-dark">{{ __('Amount') }}</p>
                    <h4 id="amount">{{ $payments->sum('amount') }}</h4>
                </div>
            </div>
        </div>
    </div>
</div>

<table id="datatable" class="table  table-hover table-sm nowrap table-bordered p-0 m-0" data-page-length="50"
    style="text-align: center">
    <thead>
        <tr>
            <th class="alert-success">#</th>
            <th class="alert-success">{{ trans('admin/payment_trans.Student_Name') }}</th>
            <th class="alert-success">{{ trans('admin/payment_trans.Email') }} </th>
            <th class="alert-success">{{ trans('admin/payment_trans.Gender') }}</th>
            <th class="alert-success">{{ trans('admin/payment_trans.Grade') }}</th>
            <th class="alert-success">{{ trans('admin/payment_trans.Class') }}</th>
            <th class="alert-success">{{ trans('admin/payment_trans.Section') }}</th>
            <th class="alert-success">{{ trans('admin/payment_trans.Payment_Date') }}</th>
            {{-- <th class="alert-success">{{ trans('admin/payment_trans.Last_Update') }}</th> --}}
            <th class="alert-success">{{ trans('admin/payment_trans.Payment_Status') }}</th>
        </tr>
    </thead>
    <tbody id="student-table-body">
        @foreach ($section->students as $student)
        <?php
        $student_payment = $student
            ->payment()
            ->where('student_id', $student->id)
            ->where('section_id', $student->section_id)
            ->first();

        ?>

        <tr>
            <input type="hidden" name="student_id[]" value="{{ $student->id }}">
            <input type="hidden" name="grade_id" value="{{ $student->grade_id }}">
            <input type="hidden" name="class_id" value="{{ $student->class_id }}">
            <input type="hidden" name="section_id" value="{{ $student->section_id }}">
            <input type="hidden" name="payment_date" value="{{ carbon\Carbon::now('Egypt')->format('Y-m-d') }}">

            <td>{{ $loop->index + 1 }}</td>
            <td>{{ $student->name }}</td>
            <td>{{ $student->email }}</td>
            <td>{{ $student->gender }}</td>
            <td>{{ $student->grade->grade_name }}</td>
            <td>{{ $student->class->class_name }}</td>
            <td>{{ $student->section->section_name }}</td>
            <td>
                {{ $student_payment->payment_date ?? '' }}
            </td>
            <td>

                @isset($student_payment)
                @if ($student_payment->payment_status === 1)

                <span class="text-success">{{ trans('admin/payment_trans.Paid') }}</span>

                @else

                <span class="text-danger">{{ trans('admin/payment_trans.Not_Paid') }}</span>


                @endif

                @endisset


            </td>
        </tr>

        @endforeach
    </tbody>
</table>



@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('filter-form');
        const clearBtn = document.getElementById('clear-filter');
        const fromInput = form.querySelector('[name="from"]');
        const toInput = form.querySelector('[name="to"]');

        const today = new Date().toISOString().split('T')[0];

        const endOfMonth = (() => {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        })();

        function fetchData(from, to) {
            fetch(`{{ route('report.sectionFees', $section->id) }}?from=${from}&to=${to}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(res => res.json())
                .then(data => {
                    // Update card counts
                    document.getElementById('students-count').textContent = data.students_count;
                    document.getElementById('paid-students').textContent = data.paid_students;
                    document.getElementById('unpaid-students').textContent = data.unpaid_students;
                    document.getElementById('amount').textContent = data.amount;

                    // Re-render table rows
                    const tbody = document.getElementById('student-table-body');
                    tbody.innerHTML = ''; // Clear existing

                    if (data.students.length > 0) {
                        data.students.forEach(student => {
                            const row = `
                <tr>
                    <td>${student.index}</td>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.gender}</td>
                    <td>${student.grade}</td>
                    <td>${student.class}</td>
                    <td>${student.section}</td>
                    <td>${student.payment_date}</td>
                   <td>
                       @if($student->payment_status)

                        @if ($student->payment_status === 1)
                            <span class="text-success">{{ trans('admin/payment_trans.Paid') }}</span>
                        @else
                            <span class="text-danger">{{ trans('admin/payment_trans.Not_Paid') }}</span>
                        @endif

                       @else
                       
                       <span></span>

                       @endif
                    </td>
                </tr>`;
                            tbody.insertAdjacentHTML('beforeend', row);
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No records found</td></tr>';
                    }
                })
                .catch(err => {
                    alert('Error loading data.');
                    console.error(err);
                });
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            fetchData(fromInput.value, toInput.value);
        });

        clearBtn.addEventListener('click', function() {
            fromInput.value = today;
            toInput.value = endOfMonth;
            fetchData(today, endOfMonth);
        });
    });
</script>
@endpush