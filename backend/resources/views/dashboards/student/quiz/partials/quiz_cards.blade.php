<div class="row g-4 mt-4">
    @forelse ($quizes as $quiz)
        <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-lg border-4 rounded-3 h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-primary fw-bold mb-2">
                        {{ $quiz->students->name }}
                    </h5>
                    <h6 class="text-muted mb-3">
                        {{ $quiz->grade->grade_name }} - {{ $quiz->class->class_name }} / {{ $quiz->section->section_name }}
                    </h6>

                    <ul class="list-unstyled flex-grow-1">
                        <li>
                            <strong>{{ trans('Student_Dashboard/student_trans.Quiz_Date') }}:</strong>
                            <span class="text-dark">{{ $quiz->quiz_date }}</span>
                        </li>
                        <li>
                            <strong>{{ trans('Student_Dashboard/student_trans.Degree') }}:</strong>
                            <span class="text-success fw-bold">{{ $quiz->degree }} / {{ $quiz->final_degree }}</span>
                        </li>
                        @if ($quiz->notes)
                            <li>
                                <strong>{{ trans('Student_Dashboard/student_trans.Notes') }}:</strong>
                                <span class="text-info">{{ $quiz->notes }}</span>
                            </li>
                        @endif
                    </ul>
                </div>
            </div>
        </div>
    @empty
        <div class="col-12">
            <div class="alert alert-warning text-center">
                {{ trans('Student_Dashboard/student_trans.No_Quiz') }}
            </div>
        </div>
    @endforelse
</div>
