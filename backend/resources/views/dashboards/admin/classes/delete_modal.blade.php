 <!-- delete_modal_Grade -->
 <div class="modal fade" id="deleteClassModal{{ $class->id }}" tabindex="-1" role="dialog" aria-labelledby="DeleteClassModal"
     aria-hidden="true">
     <div class="modal-dialog" role="document">
         <div class="modal-content">
             <div class="modal-header">
                 <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="DeleteClassModal">
                     {{ trans('admin/classes_trans.Delete_class') }}
                 </h5>
                 <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                     <span aria-hidden="true">&times;</span>
                 </button>
             </div>
             <div class="modal-body">
                 <form action="{{ route('classes.destroy', 'test') }}" method="post">
                     {{ method_field('Delete') }}
                     @csrf
                     {{ trans('admin/classes_trans.Warning_Classes') }}
                     <input id="id" type="hidden" name="id" class="form-control"
                         value="{{ $class->id }}">
                     <div class="modal-footer">
                         <button type="button" class="btn btn-secondary"
                             data-dismiss="modal">{{ trans('admin/classes_trans.Close') }}</button>
                         <button type="submit"
                             class="btn btn-danger">{{ trans('admin/classes_trans.submit') }}</button>
                     </div>
                 </form>
             </div>
         </div>
     </div>
 </div>
