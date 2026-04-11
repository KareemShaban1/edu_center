<!-- Deleted inFormation Student -->
<div class="modal fade" id="Delete_Announcement{{ $announcement->id }}" tabindex="-1" aria-labelledby="exampleModalLabel"
    aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">

            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">
                    {{ trans('admin/announcements_trans.Delete_Announcement') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>


            <div class="modal-body">
                <form action="{{ route('announcements.destroy', $announcement->id) }}" method="post">
                    @csrf
                    @method('DELETE')
                    <input type="hidden" name="id" value="{{ $announcement->id }}">
                    <h5 style="font-family: 'Cairo', sans-serif;">
                        {{ trans('admin/announcements_trans.Are_You_Sure') }}

                    </h5>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">
                            {{ trans('admin/announcements_trans.Close') }}
                        </button>
                        <button class="btn btn-danger">
                            {{ trans('admin/announcements_trans.Submit') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
