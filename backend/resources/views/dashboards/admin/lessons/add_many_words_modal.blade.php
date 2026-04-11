<div class="modal fade" id="addManyWordsModal" tabindex="-1" role="dialog" aria-labelledby="addManyWordsModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="addManyWordsModalLabel">
                    {{ trans('admin/words_trans.Add_Word') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">

                <form action="{{ route('words.storeMultiple') }}" method="POST">
                    @csrf
                    <input type="hidden" name="lesson_id" value="{{ $lesson->id }}">

                    <div id="word-fields">
                        <div class="word-group border p-3 mb-2">
                            <div class="row">
                                <div class="col-md-4">
                                    <label>{{ trans('admin/words_trans.word') }}</label>
                                    <input type="text" name="words[0][word]" class="form-control" required>
                                </div>
                                <div class="col-md-4">
                                    <label>{{ trans('admin/words_trans.Translation') }}</label>
                                    <input type="text" name="words[0][translation]" class="form-control" required>
                                </div>
                                <div class="col-md-3">
                                    <label>{{ trans('admin/words_trans.Type') }}</label>
                                    <select name="words[0][type]" class="form-control" required>
                                        <option value="">{{ trans('admin/words_trans.select_type') }}</option>
                                        <option value="english">English</option>
                                        <option value="arabic">Arabic</option>
                                    </select>
                                </div>
                                <div class="col-md-1 d-flex align-items-end">
                                    <button type="button" class="btn btn-danger remove-word-group">×</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="button" id="add-word-group" class="btn btn-primary mb-3">
                        + {{ trans('admin/words_trans.Add_Word') }}
                    </button>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">
                            {{ trans('admin/words_trans.Close') }}
                        </button>
                        <button type="submit" class="btn btn-success">
                            {{ trans('admin/words_trans.submit') }}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    </div>