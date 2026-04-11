<!-- add_modal_class -->
<div class="modal fade" id="addClassModal" tabindex="-1" role="dialog" aria-labelledby="AddClassModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title" id="AddClassModalLabel">
                    {{ trans('admin/classes_trans.Add_Class') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">

                <form class=" row mb-30" action="{{ route('classes.store') }}" method="POST">
                    @csrf
                    <div class="card-body">
                        <div class="repeater">
                            <div data-repeater-list="Classes_List">
                                <div data-repeater-item>
                                    <div class="row">

                                        <div class="col-12 col-md-3">
                                            <label for="class_name"
                                                class="mr-sm-2">{{ trans('admin/classes_trans.Class_Name') }}
                                                :</label>
                                            <input class="form-control" type="text" id="class_name" name="class_name" />
                                        </div>


                                        <div class="col-12 col-md-3">
                                            <label for="grade_id"
                                                class="mr-sm-2">{{ trans('admin/classes_trans.Grade_Name') }}
                                                :</label>

                                            <div class="box">
                                                <select class="fancyselect" name="grade_id" id="grade_id">
                                                    @foreach ($grades as $grade)
                                                        <option value="{{ $grade->id }}">{{ $grade->grade_name }}
                                                        </option>
                                                    @endforeach
                                                </select>
                                            </div>

                                        </div>

                                        <div class="col-12 col-md-3">
                                            <label for="processes"
                                                class="mr-sm-2">{{ trans('admin/classes_trans.Processes') }}
                                                :</label>
                                            <input class="btn btn-danger btn-block" id="processes" data-repeater-delete
                                                type="button"
                                                value="{{ trans('admin/classes_trans.delete_row') }}" />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="row mt-20">
                                <div class="col-12">
                                    <input class="button" data-repeater-create type="button"
                                        value="{{ trans('admin/classes_trans.add_row') }}" />
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary"
                                    data-dismiss="modal">{{ trans('admin/classes_trans.Close') }}</button>
                                <button type="submit"
                                    class="btn btn-success">{{ trans('admin/classes_trans.submit') }}</button>
                            </div>

                        </div>
                    </div>
                </form>
            </div>


        </div>

    </div>

</div>
