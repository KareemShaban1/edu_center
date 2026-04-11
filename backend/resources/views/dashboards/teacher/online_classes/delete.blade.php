<!-- Deleted Online CLasses -->
<div class="modal fade" id="Delete_online_course{{$online_classe->meeting_id}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">

        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">{{ trans('Teacher_Dashboard/online_classes_trans.Delete') }} {{$online_classe->topic}}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">
                
                <form action="{{route('online_zoom_classes.destroy',$online_classe->id)}}" method="post">
                    @csrf
                    @method('DELETE')
                    <input type="hidden" name="meeting_id" value="{{$online_classe->meeting_id}}">
                    <h5 style="font-family: 'Cairo', sans-serif;">
                        {{ trans('Teacher_Dashboard/online_classes_trans.Delete_Sure') }}
                    </h5>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">{{ trans('Teacher_Dashboard/online_classes_trans.Close') }}</button>
                        <button  class="btn btn-danger">{{ trans('Teacher_Dashboard/online_classes_trans.Submit') }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
