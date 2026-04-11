     <!-- edit_modal_Lesson -->
     <div class="modal fade" id="edit{{ $lesson->id }}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
         aria-hidden="true">
         <div class="modal-dialog" role="document">
             <div class="modal-content">

                 <div class="modal-header">
                     <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">
                         {{ trans('admin/lessons_trans.Edit_Lesson') }}
                     </h5>
                     <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                         <span aria-hidden="true">&times;</span>
                     </button>
                 </div>

                 <div class="modal-body">
                     <!-- edit form -->
                     <form action="{{ route('lessons.update', $lesson->id) }}" method="post" autocomplete="off">
                         {{ method_field('patch') }}
                         @csrf
                         <div class="row">

                             <div class="col">
                                 <label for="name"
                                     class="mr-sm-2">{{ trans('admin/lessons_trans.stage_name_ar') }}:</label>
                                 <input id="name" type="text" id="name" name="name" class="form-control"
                                     value="{{ $lesson->name }}" required>

                                 <input id="id" type="hidden" name="id" class="form-control"
                                     value="{{ $lesson->id }}">
                             </div>

                         </div>
                         <div class="row">
                            <div class="col">
                                <label for="unit_id" class="mr-sm-2">{{ trans('admin/lessons_trans.unit') }}
                                    :</label>
                                <select name="unit_id" id="unit_id" class="form-control">
                                    <option value="">{{ trans('admin/lessons_trans.select_unit') }}</option>
                                    @foreach ($units as $unit)
                                        <option value="{{ $unit->id }}" {{ $unit->id == $lesson->unit_id ? 'selected' : '' }}>
                                            {{ $unit->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                         <div class="form-group">
                             <label for="notes">{{ trans('admin/lessons_trans.Notes') }}
                                 :</label>
                             <textarea class="form-control" name="notes" id="notes" rows="3">{{ $lesson->notes }}</textarea>
                         </div>
                         <br><br>

                         <div class="modal-footer">
                             <button type="button" class="btn btn-secondary"
                                 data-dismiss="modal">{{ trans('admin/lessons_trans.Close') }}</button>
                             <button type="submit"
                                 class="btn btn-success">{{ trans('admin/lessons_trans.submit') }}</button>
                         </div>
                     </form>

                 </div>
             </div>
         </div>
     </div>
