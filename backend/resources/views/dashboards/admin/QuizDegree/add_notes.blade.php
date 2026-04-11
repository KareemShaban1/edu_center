<!-- add_modal_class -->
<div class="modal fade" id="addNote{{ $quiz->id }}" tabindex="-1" role="dialog" aria-labelledby="AddNoteModal" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="AddNoteModal">
                    {{ trans('admin/notes_trans.Add_Note') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">

                <form class=" row mb-30" action="{{ route('notes.store') }}" method="POST">
                    @csrf
                    <input type="hidden" name="noteable_id" value="{{ $quiz->id }}">
                    <input type="hidden" name="noteable_type" value="{{ get_class($quiz) }}">
                    <div class="card-body">

                        <div class="row">

                            <div class="col-12 col-md-12">
                                <label for="Title"
                                    class="mr-sm-2">{{ trans('admin/notes_trans.Title') }}
                                    :</label>
                                <input class="form-control" type="text" id="Title" name="title" />
                            </div>


                            <div class="col-12 col-md-12">
                                <label for="Content"
                                    class="mr-sm-2">{{ trans('admin/notes_trans.Content') }}
                                    :</label>
                                <textarea class="form-control" name="content" id="Content" rows="3"></textarea>
                            </div>


                            <div class="col-12 col-md-12">
                                <label for="date_time"
                                    class="mr-sm-2">{{ trans('admin/notes_trans.Date_Time') }}
                                    :</label>
                                <input type="datetime-local" class="form-control" id="date_time" name="date_time" />
                            </div>


                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary"
                                data-dismiss="modal">{{ trans('admin/classes_trans.Close') }}</button>
                            <button type="submit"
                                class="btn btn-success">{{ trans('admin/classes_trans.submit') }}</button>
                        </div>


                    </div>
                </form>
            </div>


        </div>

    </div>

</div>