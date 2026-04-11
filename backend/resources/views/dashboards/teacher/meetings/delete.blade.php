<div class="modal fade" id="Delete_meeting{{ $m->id }}" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ trans('Teacher_Dashboard/online_classes_trans.Delete') }} {{ $m->topic }}</h5>
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>
            </div>
            <div class="modal-body">
                <form action="{{ route('teacher_meetings.destroy', $m->id) }}" method="post">
                    @csrf
                    @method('DELETE')
                    <p>{{ trans('Teacher_Dashboard/online_classes_trans.Delete_Sure') }}</p>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">{{ trans('Teacher_Dashboard/online_classes_trans.Close') }}</button>
                        <button class="btn btn-danger">{{ trans('Teacher_Dashboard/online_classes_trans.Submit') }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
