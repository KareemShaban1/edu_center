<div class="row g-4 mt-4">
    @forelse ($exams as $exam)
        <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-lg border-4 rounded-3 h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-primary fw-bold mb-2">
                        {{ $exam->students->name }}
                    </h5>
                    <h6 class="text-muted mb-3">
                        {{ $exam->grade->grade_name }} - {{ $exam->class->class_name }} / {{ $exam->section->section_name }}
                    </h6>

                    <ul class="list-unstyled flex-grow-1">
                        <li>
                            <strong>{{ trans('Student_Dashboard/student_trans.Exam_Date') }}:</strong>
                            <span class="text-dark">{{ $exam->exam_date }}</span>
                        </li>
                        <li>
                            <strong>{{ trans('Student_Dashboard/student_trans.Degree') }}:</strong>
                            <span class="text-success fw-bold">{{ $exam->degree }} / {{ $exam->final_degree }}</span>
                        </li>
                        @if ($exam->notes)
                            <li>
                                <strong>{{ trans('Student_Dashboard/student_trans.Notes') }}:</strong>
                                <span class="text-info">{{ $exam->notes }}</span>
                            </li>
                        @endif
                    </ul>
                </div>
            </div>
        </div>
    @empty
        <div class="col-12">
            <div class="alert alert-warning text-center">
                {{ trans('Student_Dashboard/student_trans.No_Exams') }}
            </div>
        </div>
    @endforelse
</div>
