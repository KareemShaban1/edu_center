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
        .question-checkbox {
            display: none !important;
        }
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
    <div class="p-4 bg-white rounded-lg shadow-md mb-6">
        <div class="flex flex-wrap items-center gap-4 mb-4">
            <div>
                <label for="startIndex" class="block text-sm font-medium text-gray-700">{{ trans('Start Index') }}</label>
                <input type="number" id="startIndex" min="1" value="1" class="mt-1 block w-20 px-2 py-1 border border-gray-300 rounded-md text-sm">
            </div>

            <div>
                <label for="langDirection" class="block text-sm font-medium text-gray-700">{{ trans('Language') }}</label>
                <select id="langDirection" class="mt-1 block w-40 px-2 py-1 border border-gray-300 rounded-md text-sm">
                    <option value="rtl">RTL (Arabic)</option>
                    <option value="ltr">LTR (English)</option>
                </select>
            </div>

            <div>
                <label for="randomCount" class="block text-sm font-medium text-gray-700">{{ trans('Random Count') }}</label>
                <input type="number" id="randomCount" min="1" max="{{ count($questions) }}" class="mt-1 block w-24 px-2 py-1 border border-gray-300 rounded-md text-sm">
            </div>
        </div>

        <div class="flex flex-wrap gap-3">
            <button onclick="selectRandomQuestions()" class="bg-yellow-400 hover:bg-yellow-500 text-white text-sm px-4 py-2 rounded-md">{{ trans('Random Questions') }}</button>
            <button onclick="printSelected()" class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md">{{ trans('Print Selected') }}</button>
            <button onclick="exportSelectedToWord()" class="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-md">{{ trans('Export Selected to Word') }}</button>
        </div>
    </div>



    <div id="questionsContainer">
        <hr>

        @foreach($questions as $index => $question)
        <div class="question-block">
            <div class="flex items-center gap-4">
                <input type="checkbox" class="question-checkbox" value="{{ $index }}">
                <div class="flex items-center gap-2">
                    <h4><span class="text-red-500">{{ $index + 1 }}.</span> {{ $question->question_text }}
                    </h4>
                </div>
            </div>

            <div class="answers">
                @if($question->type == 'mcq')
                <ul style="list-style-type:lower-alpha">
                    @foreach($question->answers as $answer)
                    <li>
                        @if($answer->is_correct)
                        <!-- <b> -->
                        <span>{{ $answer->answer_text }}</span>
                        <!-- </b> -->
                        @else
                        {{ $answer->answer_text }}
                        @endif
                    </li>
                    @endforeach
                </ul>

                @elseif($question->type == 'true_false')
                <!-- <p>
                        <input type="radio" name="tf_{{ $index }}" value="true"> {{ trans('True') }}
                        <input type="radio" name="tf_{{ $index }}" value="false"> {{ trans('False') }}
                    </p> -->
                <ul style="display: flex; gap: 50px; list-style-type:lower-alpha">
                    <li>{{ trans('True') }}</li>
                    <li>{{ trans('False') }}</li>
                </ul>

                @elseif($question->type == 'short_answer')
                <p style="margin: 20px 0px;">______________________________</p>
                @endif
            </div>
        </div>
        @endforeach
    </div>
</div>

<script>
    function printSelected() {
        let startIndex = document.getElementById("startIndex").value || 1;
        let direction = document.getElementById("langDirection").value || 'rtl';
        let selectedQuestions = getSelectedQuestions(startIndex);
        if (selectedQuestions.length === 0) {
            alert("Please select questions to print.");
            return;
        }

        let newWindow = window.open();
        newWindow.document.write(`
        <html>
            <head>
                <title>Print Questions</title>
                <style>
                    body { direction: ${direction}; font-family: Arial, sans-serif; }
                    .question-checkbox { display: none !important; }
                </style>
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
        let startIndex = document.getElementById("startIndex").value || 1;
        let direction = document.getElementById("langDirection").value || 'rtl';
        let selectedQuestions = getSelectedQuestions(startIndex);
        if (selectedQuestions.length === 0) {
            alert("Please select questions to export.");
            return;
        }

        let wordDocument = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                body { direction: ${direction}; font-family: Arial, sans-serif; }
                .question-checkbox { display: none !important; }
            </style>
        </head>
        <body>
            <h2>Questions</h2>
            ${selectedQuestions}
        </body>
        </html>`;

        let blob = new Blob(['\ufeff', wordDocument], {
            type: 'application/msword'
        });
        let url = URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.href = url;
        link.download = 'Selected_Questions.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }



    function getSelectedQuestions(startIndex = 1) {
        let selectedHTML = "";
        let index = parseInt(startIndex);
        document.querySelectorAll('.question-checkbox:checked').forEach((checkbox, i) => {
            let questionBlock = checkbox.closest('.question-block').cloneNode(true);
            questionBlock.querySelector('.question-checkbox')?.remove();

            // Adjust the question index
            let questionTitle = questionBlock.querySelector('h4');
            if (questionTitle) {
                let text = questionTitle.textContent;
                text = text.replace(/^\d+\./, `${index + i}.`);
                questionTitle.textContent = text;
            }

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