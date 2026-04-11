@extends('layouts.master')

@section('css')
<style>
    .remove-btn {
        cursor: pointer;
        color: red;
    }
</style>
@endsection

@section('title')
{{ trans('admin/classes_trans.Class_Questions') }}
@endsection

@section('page-header')
<h4>{{ trans('admin/classes_trans.Class_Questions') }}</h4>
@endsection

@section('content')
<div class="container">
    <div class="card">
        <div class="card-header">
            <h5>{{ trans('admin/classes_trans.Manage_Questions') }}</h5>
            <!-- <button type="button" class="btn btn-primary btn-sm" onclick="printAnswers()">{{ trans('admin/classes_trans.Print_Questions') }}</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="downloadWord()">{{ trans('admin/classes_trans.Download_Questions') }}</button> -->
        </div>
        <div class="card-body">
            <form method="POST" action="{{ route('questions.storeOrUpdateFromClass') }}">
                @csrf
                <input type="hidden" name="class_id" value="{{ $class->id }}">

                <div id="question_container">
                    @foreach($questions as $index => $question)
                    <div class="question-block mb-4 mt-4">

                        <div>
                            <button type="button" class="btn btn-danger btn-sm remove-btn" onclick="removeQuestion({{ $index }})">❌</button>
                        </div>

                        <input type="hidden" name="questions[{{ $index }}][id]" value="{{ $question->id }}">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">{{ trans('admin/classes_trans.Question') }} {{ $index + 1 }}: </label>
                                    <input type="text" class="form-control" name="questions[{{ $index }}][question_text]" value="{{ $question->question_text }}" required>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label class="form-label">{{ trans('admin/classes_trans.Type') }}:</label>
                                    <select class="form-control question-type" name="questions[{{ $index }}][type]" onchange="updateAnswerFields(this, {{ $index }})">
                                        <option value="mcq" {{ $question->type == 'mcq' ? 'selected' : '' }}>{{ trans('admin/classes_trans.MCQ') }}</option>
                                        <option value="true_false" {{ $question->type == 'true_false' ? 'selected' : '' }}>{{ trans('admin/classes_trans.True_False') }}</option>
                                        <option value="short_answer" {{ $question->type == 'short_answer' ? 'selected' : '' }}>{{ trans('admin/classes_trans.Short_Answer') }}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label class="form-label">Lesson:</label>
                                    <!-- <input type="text" class="form-control" name="questions[{{ $index }}][lesson_id]" readonly value="{{ $question->lesson_id }}" required> -->
                                    <select class="form-control" name="questions[{{ $index }}][lesson_id]" required>
                                        <option value="">Choose</option>
                                        @foreach($lessons as $lesson)
                                        <option value="{{ $lesson->id }}" {{ $question->lesson_id == $lesson->id ? 'selected' : '' }}>
                                        {{ $lesson->name }}
                                    </option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="answers-section" id="answers_container_{{ $index }}">
                            @if($question->type == 'mcq')
                            <button type="button" class="btn btn-primary mt-2 add-answer-btn" data-index="{{ $index }}">+ {{ trans('admin/classes_trans.Add_Answer') }}</button>

                            @foreach($question->answers as $answerIndex => $answer)

                            <div class="row mb-2">
                                <div class="col-md-8">
                                    <input type="text" name="questions[{{ $index }}][answers][]" class="form-control" value="{{ $answer->answer_text }}" required>
                                </div>
                                <div class="col-md-2">
                                    <input type="checkbox" name="questions[{{ $index }}][correct_answers][]" value="{{ $answer->answer_text }}"
                                        {{ $answer->is_correct ? 'checked' : '' }}> {{ trans('admin/classes_trans.Correct') }}
                                </div>
                                <div class="col-md-2">
                                    <span class="remove-btn" onclick="removeRow(this)">❌</span>
                                </div>
                            </div>
                            @endforeach
                            @elseif($question->type == 'true_false')
                            @php
                            $correctAnswer = optional($question->answers->where('is_correct', true)->first())->answer_text;
                            $correctAnswer = trim(strtolower($correctAnswer ?? '')); // Normalize to lowercase and trim spaces

                            @endphp



                            <div>
                                <input type="radio" name="questions[{{ $index }}][correct_answer]" value="true"
                                    {{ $correctAnswer === 'true' ? 'checked="checked"' : '' }} required> {{ trans('admin/classes_trans.True') }}

                                <input type="radio" name="questions[{{ $index }}][correct_answer]" value="false"
                                    {{ $correctAnswer === 'false' ? 'checked="checked"' : '' }} required> {{ trans('admin/classes_trans.False') }}

                            </div>

                            @elseif($question->type == 'short_answer')
                            @php
                            $correctAnswer = optional($question->answers->firstWhere('is_correct', true))->answer_text;
                            @endphp
                            <input type="text" name="questions[{{ $index }}][correct_answer]" class="form-control"
                                value="{{ $correctAnswer }}" required>
                            @endif
                        </div>


                        <!-- <button type="button" class="btn btn-primary mt-2 add-answer-btn" data-index="{{ $index }}">+ {{ trans('admin/classes_trans.Add_Answer') }}</button> -->
                        <hr>
                    </div>

                    @endforeach
                </div>

                <button type="button" class="btn btn-secondary mt-3" onclick="addQuestion()">+ {{ trans('admin/classes_trans.Add_New_Question') }}</button>
                <button type="submit" class="btn btn-success mt-3">{{ trans('admin/classes_trans.Save_Questions') }}</button>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<script>
    let questionIndex = {{ isset($questions) ? count($questions) : 0 }};

    function removeQuestion(index) {
        const questionBlock = $('#question_container').children().eq(index);
        const inputId = questionBlock.find('input[name^="questions"][name$="[id]"]');

        if (inputId.length && inputId.val()) {
            const questionId = inputId.val();

            if (confirm('Are you sure you want to delete this question?')) {
                $.ajax({
                    url: `/delete_questions/${questionId}`,
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    success: function(response) {
                        questionBlock.remove();
                    },
                    error: function(xhr) {
                        alert('Failed to delete the question.');
                        console.error(xhr.responseText);
                    }
                });
            }
        } else {
            // Not yet saved in DB, just remove it from the form
            questionBlock.remove();
        }
    }


    function addQuestion() {

        let questionContainer = document.getElementById('question_container');
        let newQuestionHTML = `
        <div class="question-block mb-4 mt-4">

            <div>
                                        <button type="button" class="btn btn-danger btn-sm remove-btn" onclick="removeQuestion(${questionIndex})">❌</button>
            </div>
            <input type="hidden" name="questions[${questionIndex}][id]" value="">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Question: ${questionIndex + 1}</label>
                        <input type="text" class="form-control" name="questions[${questionIndex}][question_text]" required>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label">Type:</label>
                        <select class="form-control question-type" name="questions[${questionIndex}][type]" onchange="updateAnswerFields(this, ${questionIndex})">
                            <option value""> Choose </option>
                            <option value="mcq">MCQ</option>
                            <option value="true_false">True/False</option>
                            <option value="short_answer">Short Answer</option>
                        </select>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label">Lesson:</label>
                        <select class="form-control" name="questions[${questionIndex}][lesson_id]" required>
                            <option value="">Choose</option>
                            @foreach($lessons as $lesson)
                            <option value="{{ $lesson->id }}">{{ $lesson->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>


            </div>

            <div class="answers-section" id="answers_container_${questionIndex}">
            </div>

            <button type="button" class="btn btn-primary mt-2 add-answer-btn" data-index="${questionIndex}" style="display: none;">+ Add Answer</button>
            <hr>
        </div>
    `;
        questionContainer.insertAdjacentHTML('beforeend', newQuestionHTML);
        questionIndex++;
    }


    function removeRow(element) {
        element.closest('.row').remove();
    }

    function updateAnswerFields(selectElement, index) {
        let answerContainer = document.getElementById(`answers_container_${index}`);
        let selectedType = selectElement.value;
        // let addAnswerBtn = document.querySelector(`.add-answer-btn[data-index="${index}"]`);

        answerContainer.innerHTML = ''; // Clear existing answer fields

        if (selectedType === 'mcq') {
            answerContainer.innerHTML = `
            <button type="button" class="btn btn-primary mt-2 add-answer-btn" data-index="${index}">+ {{ trans('admin/classes_trans.Add_Answer') }}</button>
            <div class="row mb-2">
                <div class="col-md-8">
                    <input type="text" name="questions[${index}][answers][]" class="form-control" required>
                </div>
                <div class="col-md-2">
                    <input type="checkbox" name="questions[${index}][correct_answers][]" value=""> Correct
                </div>
                <div class="col-md-2">
                    <span class="remove-btn" onclick="removeRow(this)">❌</span>
                </div>
            </div>
        `;
            // addAnswerBtn.style.display = 'inline-block'; // Show button for MCQ

        } else if (selectedType === 'true_false') {
            // Retrieve the stored value if it exists
            let storedAnswer = document.querySelector(`input[name="questions[${index}][correct_answer]"]:checked`);
            let previousValue = storedAnswer ? storedAnswer.value : null;

            answerContainer.innerHTML = `
            <div>
                <input type="radio" name="questions[${index}][correct_answer]" value="true" ${previousValue === 'true' ? 'checked' : ''} required> True
                <input type="radio" name="questions[${index}][correct_answer]" value="false" ${previousValue === 'false' ? 'checked' : ''} required> False
            </div>
        `;
            // addAnswerBtn.style.display = 'none'; // Hide button for True/False

        } else if (selectedType === 'short_answer') {
            answerContainer.innerHTML = `
            <input type="text" name="questions[${index}][correct_answer]" class="form-control" required>
        `;
        }
        // addAnswerBtn.style.display = 'none'; // Hide button for True/False

    }



    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-answer-btn')) {
            let index = event.target.dataset.index;
            let answersContainer = document.getElementById(`answers_container_${index}`);

            let newAnswerHTML = `
        <div class="row mb-2">
            <div class="col-md-8">
                <input type="text" name="questions[${index}][answers][]" class="form-control" required>
            </div>
            <div class="col-md-2">
                <input type="checkbox" name="questions[${index}][correct_answers][]" value=""> Correct
            </div>
            <div class="col-md-2">
                <span class="remove-btn" onclick="removeRow(this)">❌</span>
            </div>
        </div>
        `;
            answersContainer.insertAdjacentHTML('beforeend', newAnswerHTML);
        }
    });

    function printAnswers() {
        let printContent = document.getElementById('question_container').innerHTML;
        let newWindow = window.open('', '_blank');

        newWindow.document.write(`
            <html>
            <head>
                <title>Print Answers</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    .question { font-weight: bold; margin-top: 10px; }
                    .answer { margin-bottom: 10px; color: #333; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <h1>Class Questions & Answers</h1>
                ${printContent}
            </body>
            </html>
        `);

        newWindow.document.close();
        newWindow.print();
    }

    function downloadWord() {
        let content = document.getElementById('question_container').innerHTML;

        let formattedContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    .question { font-weight: bold; margin-top: 10px; }
                    .answer { margin-bottom: 10px; color: #333; }
                </style>
            </head>
            <body>
                <h1>Class Questions & Answers</h1>
                ${content}
            </body>
            </html>
        `;

        let blob = new Blob([formattedContent], {
            type: 'application/msword'
        });
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Class_Questions.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
</script>
@endpush
