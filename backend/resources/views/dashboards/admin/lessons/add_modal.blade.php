<!-- add_modal_Lesson -->
<div class="modal fade" id="addLessonModal" tabindex="-1" role="dialog" aria-labelledby="addLessonModalLabel"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="addLessonModalLabel">
                    {{ trans('admin/lessons_trans.Add_Lesson') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <!-- add_form -->
                <form action="{{ route('lessons.store') }}" method="POST">
                    @csrf
                    <div class="row">
                        <div class="col-md-12">
                            <label for="name" class="mr-sm-2">{{ trans('admin/lessons_trans.name') }}
                                :</label>
                            <input type="text" id="name" name="name" class="form-control">
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <label for="unit_id" class="mr-sm-2">{{ trans('admin/lessons_trans.unit') }}
                                :</label>
                            <select name="unit_id" id="unit_id" class="form-control">
                                <option value="">{{ trans('admin/lessons_trans.select_unit') }}</option>
                                @foreach ($units as $unit)
                                    <option value="{{ $unit->id }}">{{ $unit->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="notes">{{ trans('admin/lessons_trans.Notes') }}
                            :</label>
                        <textarea class="form-control" name="notes" id="notes"
                            rows="3"></textarea>
                    </div>
                    <br><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                    data-dismiss="modal">{{ trans('admin/lessons_trans.Close') }}</button>
                <button type="submit" class="btn btn-success">{{ trans('admin/lessons_trans.submit') }}</button>
            </div>
            </form>

        </div>
    </div>
</div>
