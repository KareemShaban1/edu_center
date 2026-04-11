@extends('layouts.master')

@section('title', trans('Parents_Dashboard/reports_trans.Exams_Report'))

@push('styles')
<style>
    /* simple fade-in animation */
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fade-in 0.5s ease-in-out;
    }
</style>
@endpush

@section('content')
<div class="container mx-auto p-4">
    <x-backend.alert />

    <div class="card">
        <div class="card-header">
            <h2 class="text-xl font-bold text-red-600 mb-4">
                {{ trans('Parents_Dashboard/reports_trans.Exams_Report') }}
            </h2>

            <p class="mb-4 text-gray-600">
                {{ trans('Parents_Dashboard/reports_trans.Today_Date') }}: {{ date('Y-m-d') }}
            </p>

            <!-- Filters -->
            <div class="bg-white p-4 rounded-lg shadow mb-6">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ __('Start Date') }}</label>
                        <input type="date" id="start_date" class="w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ __('End Date') }}</label>
                        <input type="date" id="end_date" class="w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ __('Month Year') }}</label>
                        <input type="month" id="month_year" class="w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ __('Student') }}</label>
                        <select id="student_id" class="w-full border-gray-300 rounded-md shadow-sm">
                            <option value="">{{ __('All_Students') }}</option>
                            @foreach($students as $student)
                                <option value="{{ $student->id }}">{{ $student->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button id="filterBtn"
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            {{ __('Filter') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-body">
            <!-- Results -->
            <div id="examResults" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                    @forelse ($exams->sortByDesc('exam_date') as $exam)
                        <div class="bg-white rounded-lg shadow hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-105 p-5 flex flex-col justify-between duration-300 animate-fade-in">
                            <div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">
                                    {{ $exam->students->name }}
                                </h3>
                                <p class="text-sm text-gray-600">
                                    <span class="font-semibold">{{ trans('Parents_Dashboard/reports_trans.Exam_Date') }}:</span>
                                    {{ $exam->exam_date }}
                                </p>
                            </div>
                            <div class="mt-4">
                                <p class="text-lg font-bold text-blue-600">
                                    {{ trans('Parents_Dashboard/reports_trans.Degree') }}: {{ $exam->degree }} / {{ $exam->final_degree }}
                                </p>
                                @if ($exam->notes)
                                    <p class="text-sm text-gray-500 mt-1">
                                        {{ trans('Parents_Dashboard/reports_trans.Notes') }}: {{ $exam->notes }}
                                    </p>
                                @endif
                            </div>
                        </div>
                    @empty
                        <div class="col-span-full text-center text-gray-500">
                            {{ trans('Parents_Dashboard/reports_trans.No_Exams_Found') }}
                        </div>
                    @endforelse
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
$(document).ready(function () {
    $('#filterBtn').on('click', function () {
        let start_date = $('#start_date').val();
        let end_date = $('#end_date').val();
        let month_year = $('#month_year').val();
        let student_id = $('#student_id').val();

        $.ajax({
            url: "{{ route('sons.exam_report') }}",
            method: "GET",
            data: { start_date, end_date, month_year, student_id },
            success: function (response) {
                let exams = response.exams;
                let container = $('#examResults');
                container.empty();

                if (exams.length === 0) {
                    container.append('<p class="text-red-500 text-center">{{ trans("Parents_Dashboard/reports_trans.No_Exams_Found") }}</p>');
                    return;
                }

                let grid = $('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>');

                exams.forEach((exam) => {
                    grid.append(`
                        <div class="bg-white rounded-lg shadow hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-105 p-5 flex flex-col justify-between duration-300 animate-fade-in">
                            <div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">${exam.students.name}</h3>
                                <p class="text-sm text-gray-600">
                                    <span class="font-semibold">{{ trans('Parents_Dashboard/reports_trans.Exam_Date') }}:</span> ${exam.exam_date}
                                </p>
                            </div>
                            <div class="mt-4">
                                <p class="text-lg font-bold text-blue-600">
                                    {{ trans('Parents_Dashboard/reports_trans.Degree') }}: ${exam.degree}/${exam.final_degree}
                                </p>
                                <p class="text-sm text-gray-500 mt-1">
                                    {{ trans('Parents_Dashboard/reports_trans.Notes') }}: ${exam.notes ?? ''}
                                </p>
                            </div>
                        </div>
                    `);
                });

                container.append(grid);
            }
        });
    });
});
</script>


@endpush
