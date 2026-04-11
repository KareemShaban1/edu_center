@extends('layouts.master')

@section('css')
{{-- You can include additional tab-specific CSS here if needed --}}
@endsection

@section('title')
{{ trans('admin/words_trans.lessons') }}
@stop

@section('page-header')
{{ trans('admin/words_trans.Lesson_Name') }} : {{ $lesson->name }}
@endsection

@section('content')
<div class="row">
    <div class="card" style="width: 100%;">
        <div class="card-body">
            <div class="col-md-12">
                <!-- Nav tabs -->
                <ul class="nav nav-tabs" id="lessonTab" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" id="unit-tab" data-bs-toggle="tab" href="#unit" role="tab">{{ trans('admin/words_trans.Unit') }}</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="questions-tab" data-bs-toggle="tab" href="#questions" role="tab">{{ trans('admin/words_trans.Questions') }}</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="words-tab" data-bs-toggle="tab" href="#words" role="tab">{{ trans('admin/words_trans.Words') }}</a>
                    </li>
                </ul>

                <!-- Tab panes -->
                <div class="tab-content mt-3">
                    <div class="tab-pane fade show active" id="unit" role="tabpanel">


                        <h5>{{ trans('admin/words_trans.Unit_Name') }} :</h5>
                        <p>{{ $lesson->unit->name ?? '-' }}</p>

                        <h5> {{ trans('admin/words_trans.Unit_Description') }} : </h5>
                        <p>{{ $lesson->unit->description ?? '-' }}</p>

                        <h5>{{ trans('admin/words_trans.Lesson_Name') }} :</h5>
                        <p>{{ $lesson->name ?? '-' }}</p>
                    </div>

                    <div class="tab-pane fade" id="questions" role="tabpanel">
                        <a href="{{ route('classes.lessonQuestions', $lesson->id) }}"
                            style="margin-right: 5px;"
                            class="btn btn-info btn-sm" role="button" aria-pressed="true">
                            {{ trans('admin/words_trans.Add_Edit_Questions') }}
                        </a>
                        <h5>{{ trans('admin/words_trans.Questions') }}:</h5>
                        @forelse($lesson->questions as $question)
                        <div class="card">
                            <div class="card-body">
                               <div style="display: flex; gap: 15px;">
                               <h5>{{ $question->question_text }}</h5> 
                               <p>( {{ $question->type }} )</p>
                               </div>
                                @foreach ($question->answers as $answer)
                                <div class="border p-2 mb-2" @if($answer->is_correct) style="background-color: #d4edda;" @endif>
                                    {{ $answer->answer_text }}
                                </div>
                                @endforeach
                            </div>
                        </div>
                        @empty
                        <p>{{ trans('admin/words_trans.No_questions_available') }}.</p>
                        @endforelse
                    </div>

                    <div class="tab-pane fade" id="words" role="tabpanel">

                        <button type="button" class="btn btn-success mb-10" data-toggle="modal" data-target="#addWordModal">
                            {{ trans('admin/words_trans.Add_Word') }}
                        </button>

                        <button type="button" class="btn btn-secondary mb-10" data-toggle="modal" data-target="#addManyWordsModal">
                            {{ trans('admin/words_trans.Add_Group_Of_Words') }}
                        </button>



                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Word</th>
                                    <th>Translation</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>

                            </thead>
                            <tbody>
                                @forelse($lesson->words as $word)
                                <tr>
                                    <td>{{ $word['word'] }}</td>
                                    <td>{{ $word['translation'] }}</td>
                                    <td>{{ $word['type'] }}</td>
                                    <td>
                                        <div style="display: flex; gap: 15px">
                                            <a class="btn btn-primary text-white" data-toggle="modal" data-target="#editWordModal{{ $word->id }}">
                                                {{ trans('admin/words_trans.Edit_Word') }}
                                            </a>
                                            <form action="{{ route('words.destroy', $word->id) }}" method="POST">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="btn btn-danger">
                                                    {{ trans('admin/words_trans.Delete_Word') }}
                                                </button>
                                            </form>

                                        </div>
                                    </td>
                                </tr>
                                @include('dashboards.admin.lessons.edit_word_modal')

                                @empty
                                <p>{{ trans('admin/words_trans.no_words_available') }}</p>
                                @endforelse

                            </tbody>
                        </table>


                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- add_word_modal -->
@include('dashboards.admin.lessons.add_word_modal')

<!-- add_many_words_modal -->
@include('dashboards.admin.lessons.add_many_words_modal')

@endsection

@push('scripts')

<script>
    let wordIndex = 1;

    document.getElementById('add-word-group').addEventListener('click', function() {
        const newGroup = `
        <div class="word-group border p-3 mb-2">
            <div class="row">
                <div class="col-md-4">
                    <label>{{ trans('admin/words_trans.Word') }}</label>
                    <input type="text" name="words[${wordIndex}][word]" class="form-control" required>
                </div>
                <div class="col-md-4">
                    <label>{{ trans('admin/words_trans.Translation') }}</label>
                    <input type="text" name="words[${wordIndex}][translation]" class="form-control" required>
                </div>
                <div class="col-md-3">
                    <label>{{ trans('admin/words_trans.Type') }}</label>
                    <select name="words[${wordIndex}][type]" class="form-control" required>
                        <option value="">{{ trans('admin/words_trans.select_type') }}<</option>
                        <option value="english">English</option>
                        <option value="arabic">Arabic</option>
                    </select>
                </div>
                <div class="col-md-1 d-flex align-items-end">
                    <button type="button" class="btn btn-danger remove-word-group">×</button>
                </div>
            </div>
        </div>`;
        document.getElementById('word-fields').insertAdjacentHTML('beforeend', newGroup);
        wordIndex++;
    });

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-word-group')) {
            e.target.closest('.word-group').remove();
        }
    });
</script>
@endpush