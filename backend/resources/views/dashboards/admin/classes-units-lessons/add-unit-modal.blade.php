<!-- add_modal_Unit -->
<div class="modal fade" id="add-unit-modal" tabindex="-1" role="dialog" aria-labelledby="add-unit-modal-label"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="add-unit-modal-label">
                    {{ trans('admin/units_trans.Add_Unit') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <!-- add_form -->
                <form action="{{ route('units.store') }}" method="POST">
                    <input type="hidden" name="class_id" value="{{ $class->id }}">
                    @csrf
                    <div class="row">
                        <div class="col-md-12">
                            <label for="name" class="mr-sm-2">{{ trans('admin/units_trans.name') }}
                                :</label>
                            <input type="text" id="name" name="name" class="form-control">
                        </div>
                        
                    </div>
                    <div class="form-group">
                        <label for="notes">{{ trans('admin/units_trans.Notes') }}
                            :</label>
                        <textarea class="form-control" name="notes" id="notes"
                            rows="3"></textarea>
                    </div>
                    <br><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary"
                    data-dismiss="modal">{{ trans('admin/units_trans.Close') }}</button>
                <button type="submit" class="btn btn-success">{{ trans('admin/units_trans.submit') }}</button>
            </div>
            </form>

        </div>
    </div>
</div>