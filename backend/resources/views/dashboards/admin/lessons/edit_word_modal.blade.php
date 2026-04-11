<!-- add_modal_Word -->
<div class="modal fade" id="editWordModal{{ $word->id }}" tabindex="-1" role="dialog" aria-labelledby="lessonModalLabel"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="editWordModalLabel">
                    {{ trans('admin/words_trans.Edit_Word') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <!-- add_form -->
                <form action="{{ route('words.update', $word->id) }}" method="POST">
                    {{ method_field('patch') }}
                    <input type="hidden" name="lesson_id" value="{{ $word->lesson_id }}">
                    @csrf
                    <div class="row">
                        <div class="col-md-12">
                            <label for="word" class="mr-sm-2">{{ trans('admin/words_trans.word') }}
                                :</label>
                            <input type="text" id="word" name="word" value="{{ $word->word }}" class="form-control">
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <label for="translation" class="mr-sm-2">{{ trans('admin/words_trans.translation') }}
                                :</label>
                            <input type="text" id="translation" name="translation" value="{{ $word->translation }}" class="form-control">
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <label for="type" class="mr-sm-2">{{ trans('admin/words_trans.type') }}
                                :</label>
                            <select name="type" id="type" class="form-control">
                                <option value="">{{ trans('admin/words_trans.word_type') }}</option>
                                <option value="english" {{ $word->type === 'english' ? 'selected' : '' }} >English</option>
                                <option value="arabic" {{ $word->type === 'arabic' ? 'selected' : '' }}>Arabic</option>
                            </select>
                        </div>
                    </div>
                   
                    <br><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                    data-dismiss="modal">{{ trans('admin/words_trans.Close') }}</button>
                <button type="submit" class="btn btn-success">{{ trans('admin/words_trans.submit') }}</button>
            </div>
            </form>

        </div>
    </div>
</div>