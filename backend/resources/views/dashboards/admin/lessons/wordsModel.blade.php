@extends('layouts.master')

@section('css')
<style>
    body {
        direction: rtl;
        font-family: Arial, sans-serif;
    }

    .word-block {
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
        .word-checkbox {
            display: none !important;
        }
    }
</style>
@endsection

@section('title')
{{ trans('admin/lessons_trans.Words') }}
@endsection

@section('page-header')
<h4>{{ trans('admin/lessons_trans.Words') }}</h4>
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
                <input type="number" id="randomCount" min="1" max="{{ count($words) }}" class="mt-1 block w-24 px-2 py-1 border border-gray-300 rounded-md text-sm">
            </div>
        </div>

        <div class="flex flex-wrap gap-3">
            <button onclick="selectRandomQuestions()" class="bg-yellow-400 hover:bg-yellow-500 text-white text-sm px-4 py-2 rounded-md">{{ trans('Random Questions') }}</button>
            <button onclick="printSelected()" class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md">{{ trans('Print Selected') }}</button>
            <button onclick="exportSelectedToWord()" class="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-md">{{ trans('Export Selected to Word') }}</button>
        </div>
    </div>



    <div id="wordsContainer">
    <table class="min-w-full table-auto border border-collapse border-gray-300">
        <thead class="bg-gray-100">
            <tr>
                <th class="border px-4 py-2 w-24">{{ trans('Index') }}</th>
                <th class="border px-4 py-2">{{ trans('Word') }}</th>
                <th class="border px-4 py-2">{{ trans('Translation') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($words as $index => $word)
            <tr class="word-block">
                <td class="border px-4 py-2 flex items-center gap-2 w-24">
                    <input type="checkbox" class="word-checkbox" value="{{ $index }}">
                    <!-- <input type="text" class="form-input px-2 py-1 border rounded w-24 word-input" placeholder="{{ $index + 1 }}"> -->
                </td>
                <td class="border px-4 py-2">
                    <span class="word-text">{{ $word->word }}</span>
                </td>
                <td class="border px-4 py-2">
                    <span class="translation-text"></span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

</div>

<script>
    function printSelected() {
        let startIndex = document.getElementById("startIndex").value || 1;
        let direction = document.getElementById("langDirection").value || 'rtl';
        let selectedQuestions = getSelectedWords(startIndex);
        if (selectedQuestions.length === 0) {
            alert("Please select words to print.");
            return;
        }

        let newWindow = window.open();
        newWindow.document.write(`
        <html>
            <head>
                <title>Print Questions</title>
                <style>
                    body { direction: ${direction}; font-family: Arial, sans-serif; }
                    .word-checkbox { display: none !important; }
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
        let selectedQuestions = getSelectedWords(startIndex);
        if (selectedQuestions.length === 0) {
            alert("Please select words to export.");
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
                .word-checkbox { display: none !important; }
            </style>
        </head>
        <body>
            <h2>Quiz</h2>
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



    function getSelectedWords(startIndex = 1) {
    let index = parseInt(startIndex);
    let rowsHTML = "";

    document.querySelectorAll('.word-checkbox:checked').forEach((checkbox, i) => {
        let row = checkbox.closest('tr');
        let input = row.querySelector('.word-input')?.value || `${index + i}`;
        let word = row.querySelector('.word-text')?.textContent || '';
        let translation = row.querySelector('.translation-text')?.textContent || '';

        rowsHTML += `
            <tr>
                <td style="padding: 5px; border: 1px solid #000;">${input}</td>
                <td style="padding: 5px; border: 1px solid #000;">${word}</td>
                <td style="padding: 5px; border: 1px solid #000;">${translation}</td>
            </tr>
        `;
    });

    if (!rowsHTML) return "";

    return `
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
            <thead>
                <tr>
                    <th style="padding: 5px; border: 1px solid #000;">#</th>
                    <th style="padding: 5px; border: 1px solid #000;">Word</th>
                    <th style="padding: 5px; border: 1px solid #000;">Translation</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;
}




    function selectRandomQuestions() {
        let count = parseInt(document.getElementById("randomCount").value);
        let checkboxes = document.querySelectorAll('.word-checkbox');
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