<!-- Deleted inFormation Student -->
<div class="modal fade" id="Delete_receipt{{ $online_class->meeting_id }}" tabindex="-1"
    aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">
                    {{ trans('admin/online_classes_trans.Delete') }}
                    {{ $online_class->topic }}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('online_classes.destroy', 'test') }}" method="post">
                    @csrf
                    @method('DELETE')
                    <input type="hidden" name="id" value="{{ $online_class->id }}">
                    <input type="hidden" name="meeting_id" value="{{ $online_class->meeting_id }}">
                    <h5 style="font-family: 'Cairo', sans-serif;">
                        {{ trans('admin/online_classes_trans.Delete_Online_Classes_Warning') }}

                    </h5>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary"
                            data-dismiss="modal">{{ trans('admin/online_classes_trans.Close') }}</button>
                        <button
                            class="btn btn-danger">{{ trans('admin/online_classes_trans.Submit') }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
