    <!-- Add Section Modal -->
    <div class="modal fade" id="addSectionModal" tabindex="-1" role="dialog" aria-labelledby="addSectionModal"
        aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title" style="font-family: 'Cairo', sans-serif;" id="addSectionModal">
                        {{ trans('admin/sections_trans.Add_Section') }}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">

                    <form action="{{ route('sections.store') }}" method="POST">
                        @csrf

                        <div class="row">
                            <div class="col">
                                <label for="section_name"
                                    class="control-label">{{ trans('admin/sections_trans.Section_name') }}</label>
                                <input type="text" id="section_name" name="section_name" class="form-control">
                            </div>

                           

                        </div>
                        <br>


                        <div class="col">
                            <label for="grade_id"
                                class="control-label">{{ trans('admin/sections_trans.Name_Grade') }}</label>
                            <select name="grade_id" id="grade_id" class="custom-select"
                                onchange="console.log($(this).val())">

                                <option value="" selected disabled>
                                    {{ trans('admin/sections_trans.Select_Grade') }}
                                </option>
                                @foreach ($grades as $grade)
                                    <option value="{{ $grade->id }}"> {{ $grade->grade_name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <br>

                        <div class="col">
                            <label for="class_id"
                                class="control-label">{{ trans('admin/sections_trans.Class_Name') }}</label>
                            <select name="class_id" id="class_id" class="custom-select">

                            </select>
                        </div><br>

                        <div class="col">
                            <label for="teacher_id"
                                class="control-label">{{ trans('admin/sections_trans.Teacher_Name') }}</label>
                            <select multiple name="teacher_id[]" id="teacher_id" class="form-control">
                                @foreach ($teachers as $teacher)
                                    <option value="{{ $teacher->id }}">{{ $teacher->name }}</option>
                                @endforeach
                            </select>
                        </div>


                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary"
                        data-dismiss="modal">{{ trans('admin/sections_trans.Close') }}</button>
                    <button type="submit"
                        class="btn btn-danger">{{ trans('admin/sections_trans.submit') }}</button>
                </div>
                </form>
            </div>
        </div>
    </div>
