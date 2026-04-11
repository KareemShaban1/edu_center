<!-- add_modal_Grade -->
<div class="modal fade" id="addGrade" tabindex="-1" role="dialog" aria-labelledby="addGradeLabel"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="addGradeLabel">
                    {{ trans('admin/grades_trans.Add_Grade') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <!-- add_form -->
                <form action="{{ route('grades.store') }}" method="POST">
                    @csrf
                    <div class="row">
                        <div class="col">
                            <label for="grade_name" class="mr-sm-2">{{ trans('admin/grades_trans.grade_name') }}
                                :</label>
                            <input id="grade_name" type="text" id="grade_name" name="grade_name" class="form-control">
                        </div>
                        
                    </div>
                    <div class="form-group">
                        <label for="notes">{{ trans('admin/grades_trans.Notes') }}
                            :</label>
                        <textarea class="form-control" name="notes" id="notes"
                            rows="3"></textarea>
                    </div>
                    <br><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                    data-dismiss="modal">{{ trans('admin/grades_trans.Close') }}</button>
                <button type="submit" class="btn btn-success">{{ trans('admin/grades_trans.submit') }}</button>
            </div>
            </form>

        </div>
    </div>
</div>