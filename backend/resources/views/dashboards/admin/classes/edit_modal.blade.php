    <!-- Class Edit Modal -->
    <div class="modal fade" id="editClassModal{{ $class->id }}" tabindex="-1" role="dialog" aria-labelledby="classModal"
        aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">

                <div class="modal-header">

                    <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="classModal">
                        {{ trans('admin/classes_trans.Edit_Class') }}
                    </h5>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <!-- edit_form -->
                    <form action="{{ route('classes.update', $class->id) }}" method="post">
                        {{ method_field('patch') }}
                        @csrf
                        <div class="row">

                            <div class="col">
                                <label for="class_name"
                                    class="mr-sm-2">{{ trans('admin/classes_trans.Class_Name') }}
                                    :</label>
                                <input id="class_name" type="text" id="class_name" name="class_name" class="form-control"
                                    value="{{ $class->class_name }}" required>
                                <input id="id" type="hidden" name="id" class="form-control"
                                    value="{{ $class->id }}">
                            </div>
                        </div><br>
                        <div class="form-group">
                            <label for="grade_id">{{ trans('admin/classes_trans.Grade_Name') }}
                                :</label>
                            <select class="form-control form-control-lg" id="grade_id" name="grade_id">
                                @foreach ($grades as $grade)
                                    <option value="{{ $grade->id }}" @selected($class->grade->id == $grade->id)>
                                        {{ $grade->grade_name }}
                                    </option>
                                @endforeach
                            </select>

                        </div>
                        <br><br>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary"
                                data-dismiss="modal">{{ trans('admin/classes_trans.Close') }}</button>
                            <button type="submit"
                                class="btn btn-success">{{ trans('admin/classes_trans.submit') }}</button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    </div>
