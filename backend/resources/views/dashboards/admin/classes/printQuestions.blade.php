@extends('layouts.master')

@section('css')
<style>
    body {
        direction: rtl;
        font-family: Arial, sans-serif;
    }
    .question-block {
        margin-bottom: 20px;
        padding: 15px;
        border-bottom: 1px solid #ddd;
    }
    .answers {
        margin-left: 20px;
    }
    .correct-answer {
        font-weight: bold;
        color: green;
    }
    .btn-container {
        margin-bottom: 20px;
    }
    
    /* Hide checkboxes only in print and Word export */
    @media print {
        .question-checkbox { display: none !important; }
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
    <div class="btn-container">
        <input type="number" id="randomCount" min="1" max="{{ count($questions) }}" >
        <button onclick="selectRandomQuestions()" class="btn btn-warning">{{ trans('Random Questions') }}</button>
        <button onclick="printSelected()" class="btn btn-primary">{{ trans('Print Selected') }}</button>
        <button onclick="exportSelectedToWord()" class="btn btn-success">{{ trans('Export Selected to Word') }}</button>
    </div>

    <div id="questionsContainer">
        <h2>{{ trans('admin/classes_trans.Print_Questions') }}</h2>
        <hr>

        @foreach($questions as $index => $question)
        <div class="question-block">
            <div style="display: flex; gap: 10px">
            <input type="checkbox" class="question-checkbox" value="{{ $index }}">
            <h4>{{ $index + 1 }}. {{ $question->question_text }}</h4>

            </div>
        

            <div class="answers">
                @if($question->type == 'mcq')
                    <ul>
                        @foreach($question->answers as $answer)
                            <li>
                                @if($answer->is_correct)
                                    <b><span style="color:green;">{{ $answer->answer_text }}</span></b>
                                @else
                                    {{ $answer->answer_text }}
                                @endif
                            </li>
                        @endforeach
                    </ul>

                @elseif($question->type == 'true_false')
                    @php
                        $correctAnswer = optional($question->answers->where('is_correct', true)->first())->answer_text;
                    @endphp
                    <p><b><span style="color:green;">{{ ucfirst($correctAnswer) }}</span></b></p>

                @elseif($question->type == 'short_answer')
                    @php
                        $correctAnswer = optional($question->answers->firstWhere('is_correct', true))->answer_text;
                    @endphp
                    <p><b><span style="color:green;">{{ $correctAnswer }}</span></b></p>
                @endif
            </div>
        </div>
        @endforeach
    </div>
</div>

<script>
    function printSelected() {
        let selectedQuestions = getSelectedQuestions();
        if (selectedQuestions.length === 0) {
            alert("Please select questions to print.");
            return;
        }
        let newWindow = window.open();
        newWindow.document.write(`
            <html>
                <head>
                    <title>Print Questions</title>
                    <style>.question-checkbox { display: none !important; }</style>
                </head>
                <body>
                    <h2>Selected Questions</h2>
                    ${selectedQuestions}
                </body>
            </html>
        `);
        newWindow.document.close();
        newWindow.print();
    }

    function exportSelectedToWord() {
        let selectedQuestions = getSelectedQuestions();
        if (selectedQuestions.length === 0) {
            alert("Please select questions to export.");
            return;
        }

        let wordDocument = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                  xmlns:w="urn:schemas-microsoft-com:office:word" 
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="utf-8"><style>.question-checkbox { display: none !important; }</style></head>
            <body>
                <h2>Selected Questions</h2>
                ${selectedQuestions}
            </body>
            </html>`;

        let blob = new Blob(['\ufeff', wordDocument], { type: 'application/msword' });
        let url = URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.href = url;
        link.download = 'Selected_Questions.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function getSelectedQuestions() {
        let selectedHTML = "";
        document.querySelectorAll('.question-checkbox:checked').forEach(checkbox => {
            let questionBlock = checkbox.closest('.question-block').cloneNode(true);
            questionBlock.querySelector('.question-checkbox')?.remove(); // Remove checkbox only for export/print
            selectedHTML += "<div class='question-block'>" + questionBlock.innerHTML + "</div>";
        });
        return selectedHTML;
    }

    function selectRandomQuestions() {
        let count = parseInt(document.getElementById("randomCount").value);
        let checkboxes = document.querySelectorAll('.question-checkbox');
        if (isNaN(count) || count < 1 || count > checkboxes.length) {
            alert("Enter a valid number between 1 and " + checkboxes.length);
            return;
        }

        checkboxes.forEach(cb => cb.checked = false);

        let shuffled = Array.from(checkboxes).sort(() => 0.5 - Math.random());
        shuffled.slice(0, count).forEach(cb => cb.checked = true);
    }
</script>

@endsection
