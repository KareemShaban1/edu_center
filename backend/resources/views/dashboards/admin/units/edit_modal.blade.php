     <!-- edit_modal_Unit -->
     <div class="modal fade" id="edit{{ $unit->id }}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
         aria-hidden="true">
         <div class="modal-dialog" role="document">
             <div class="modal-content">

                 <div class="modal-header">
                     <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="exampleModalLabel">
                         {{ trans('admin/units_trans.Edit_Unit') }}
                     </h5>
                     <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                         <span aria-hidden="true">&times;</span>
                     </button>
                 </div>

                 <div class="modal-body">
                     <!-- edit form -->
                     <form action="{{ route('units.update', $unit->id) }}" method="post" autocomplete="off">
                         {{ method_field('patch') }}
                         @csrf
                         <div class="row">

                             <div class="col">
                                 <label for="name"
                                     class="mr-sm-2">{{ trans('admin/units_trans.name') }}:</label>
                                 <input id="name" type="text" id="name" name="name" class="form-control"
                                     value="{{ $unit->name }}" required>

                                 <input id="id" type="hidden" name="id" class="form-control"
                                     value="{{ $unit->id }}">
                             </div>


                          
                         </div>

                         <div class="row">
                            <div class="col-md-12">
                                <label for="class_id" class="mr-sm-2">{{ trans('admin/units_trans.class') }}
                                    :</label>
                                <select name="class_id" id="class_id" class="form-control">
                                    <option value="">{{ trans('admin/units_trans.select_class') }}</option>
                                    @foreach (App\Models\Classes::all() as $class)
                                        <option value="{{ $class->id }}" {{ $class->id == $unit->class_id ? 'selected' : '' }}>{{ $class->class_name }} - {{ ($class->grade->grade_name) }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                         <div class="form-group">
                             <label for="notes">{{ trans('admin/units_trans.Notes') }}
                                 :</label>
                             <textarea class="form-control" name="notes" id="notes" rows="3">{{ $unit->notes }}</textarea>
                         </div>
                         <br><br>

                         <div class="modal-footer">
                             <button type="button" class="btn btn-secondary"
                                 data-dismiss="modal">{{ trans('admin/units_trans.Close') }}</button>
                             <button type="submit"
                                 class="btn btn-success">{{ trans('admin/units_trans.submit') }}</button>
                         </div>
                     </form>

                 </div>
             </div>
         </div>
     </div>
