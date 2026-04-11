<!-- Deleted inFormation parent -->
<div class="modal fade" id="Delete_parent{{$parent->id}}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">{{trans('admin/parent_trans.Deleted_parent')}}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{route('parents.destroy','test')}}" method="post">
                    @csrf
                    @method('DELETE')

                    <input type="hidden" name="id" value="{{$parent->id}}">

                    <h5 style="font-family: 'Cairo', sans-serif;">{{trans('admin/parent_trans.Deleted_parent_tilte')}}</h5>
                    <input type="text" readonly value="{{$parent->name}}" class="form-control">

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">{{trans('admin/parent_trans.Close')}}</button>
                        <button  class="btn btn-danger">{{trans('admin/parent_trans.submit')}}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
