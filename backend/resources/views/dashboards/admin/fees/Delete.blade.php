<!-- Deleted inFormation Student -->
<div class="modal fade" id="Delete_Fee{{$Fee->id}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">{{trans('admin/students_trans.Deleted_Student')}}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{route('fees.destroy','test')}}" method="post">
                    @csrf
                    @method('DELETE')
                    <input type="hidden" name="id" value="{{$Fee->id}}">
                    <h5 style="font-family: 'Cairo', sans-serif;">
                        {{ trans('admin/fees_trans.Delete_Fee_Warning') }}
                    </h5>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">{{trans('admin/students_trans.Close')}}</button>
                        <button  class="btn btn-danger">{{trans('admin/students_trans.Submit')}}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
