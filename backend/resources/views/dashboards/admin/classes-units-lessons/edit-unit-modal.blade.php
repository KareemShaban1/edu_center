<!-- edit_modal_Unit -->
<div class="modal fade" id="edit{{ $unit->id }}" tabindex="-1" role="dialog" aria-labelledby="edit-unit-modal-label"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="edit-unit-modal-label">
                    {{ trans('admin/units_trans.Edit_Unit') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <!-- edit_form -->
                <form action="{{ route('units.update', $unit->id) }}" method="POST">
                    <input type="hidden" name="unit_id" value="{{ $unit->id }}">
                    <input type="hidden" name="class_id" value="{{ $unit->class_id }}">
                    @csrf
                    @method('PUT')
                    <div class="row">
                        <div class="col-md-12">
                            <label for="name" class="mr-sm-2">{{ trans('admin/units_trans.Name') }}
                                :</label>
                            <input type="text" id="name" name="name" value="{{ $unit->name }}" class="form-control">
                        </div>

                    </div>
                    <div class="form-group">
                        <label for="notes">{{ trans('admin/units_trans.Notes') }}
                            :</label>
                        <textarea class="form-control" name="notes" id="notes"
                            rows="3">
                        {{ $unit->notes }}
                        </textarea>
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