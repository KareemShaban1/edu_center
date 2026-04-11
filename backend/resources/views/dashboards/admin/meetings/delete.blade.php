<div class="modal fade" id="Delete_meeting{{ $meeting->id }}" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ trans('admin/online_classes_trans.Delete') }} {{ $meeting->topic }}</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <form action="{{ route('meetings.destroy', $meeting->id) }}" method="post">
                    @csrf
                    @method('DELETE')
                    <p>{{ trans('admin/online_classes_trans.Delete_Online_Classes_Warning') }}</p>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">{{ trans('admin/online_classes_trans.Close') }}</button>
                        <button class="btn btn-danger">{{ trans('admin/online_classes_trans.Submit') }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
