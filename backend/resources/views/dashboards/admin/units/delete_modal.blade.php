  <!-- delete_modal_Unit -->
  <div class="modal fade" id="delete{{ $unit->id }}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
      aria-hidden="true">
      <div class="modal-dialog" role="document">
          <div class="modal-content">
              <div class="modal-header">
                  <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">
                      {{ trans('admin/units_trans.Delete_Unit') }}
                  </h5>
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                  </button>
              </div>
              <div class="modal-body">
                  <form action="{{ route('units.destroy', 'test') }}" method="post">
                      {{ method_field('Delete') }}
                      @csrf
                      {{ trans('admin/units_trans.Warning_Unit') }}
                      <input id="id" type="hidden" name="id" class="form-control"
                          value="{{ $unit->id }}">
                      <div class="modal-footer">
                          <button type="button" class="btn btn-secondary"
                              data-dismiss="modal">{{ trans('admin/units_trans.Close') }}</button>
                          <button type="submit"
                              class="btn btn-danger">{{ trans('admin/units_trans.submit') }}</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  </div>
