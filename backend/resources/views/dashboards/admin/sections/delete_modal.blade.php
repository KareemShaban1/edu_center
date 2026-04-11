    <!-- delete Grade modal -->
    <div class="modal fade" id="deleteSectionModal{{ $section->id }}" tabindex="-1" role="dialog" aria-labelledby="deleteSectionModalLabel"
        aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="deleteSectionModalLabel">
                        {{ trans('admin/sections_trans.Delete_Section') }}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('sections.destroy', $section->id) }}" method="post">
                        {{ method_field('Delete') }}
                        @csrf
                        {{ trans('admin/sections_trans.Warning_Section') }}
                        <input id="id" type="hidden" name="id" class="form-control"
                            value="{{ $section->id }}">
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary"
                                data-dismiss="modal">{{ trans('admin/sections_trans.Close') }}</button>
                            <button type="submit"
                                class="btn btn-danger">{{ trans('admin/sections_trans.submit') }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>