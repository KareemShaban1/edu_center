<div class="modal fade" id="editSectionModal{{ $section->id }}" tabindex="-1" role="dialog" aria-labelledby="editSectionModalLabel"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" style="font-family: 'Cairo', sans-serif;" id="editSectionModalLabel">
                    {{ trans('admin/sections_trans.Edit_Section') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">

                <form action="{{ route('sections.update', $section->id) }}" method="POST">
                    @method('patch')
                    @csrf
                    <div class="row">
                        <div class="col">
                            <label for="section_name"
                                class="control-label">{{ trans('admin/sections_trans.Section_name') }}</label>
                            <input type="text" name="section_name" class="form-control" id="section_name"
                                value="{{ $section->section_name }}">
                        </div>

                        

                    </div>
                    <br>


                    <div class="col">
                        <label for="grade_id"
                            class="control-label">{{ trans('admin/sections_trans.Name_Grade') }}</label>
                        <select name="grade_id" id="grade_id" class="custom-select"
                            onclick="console.log($(this).val())">

                            @foreach ($grades as $grade)
                                <option value="{{ $grade->id }}" @selected($section->grade->id == $grade->id)>
                                    {{ $grade->grade_name }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <br>

                    <div class="col">
                        <label for="class_id"
                            class="control-label">{{ trans('admin/sections_trans.Class_Name') }}</label>
                        <select name="class_id" id="class_id" class="custom-select">
                            <option value="{{ $section->class->id }}">
                                {{ $section->class->class_name }}
                            </option>
                        </select>
                    </div>
                    <br>

                    <div class="col">
                        <div class="form-check">

                            @if ($section->status === 1)
                                <input type="checkbox" checked class="form-check-input" name="status" id="status">
                            @else
                                <input type="checkbox" class="form-check-input" name="status" id="status">
                            @endif

                            <label class="form-check-label"
                                for="status">{{ trans('admin/sections_trans.Status') }}</label><br>


                            <div class="col">
                                <label for="teacher_id"
                                    class="control-label">{{ trans('admin/sections_trans.Teacher_Name') }}</label>
                                <select multiple name="teacher_id[]" class="form-control">
                                    @if ($section->teachers && count($section->teachers) > 0)
                                        @foreach ($section->teachers as $teacher)
                                            <option selected value="{{ $teacher['id'] }}">{{ $teacher['name'] }}
                                            </option>
                                        @endforeach
                                    @else
                                        @foreach ($teachers as $teacher)
                                            <option value="{{ $teacher->id }}">{{ $teacher->name }}</option>
                                        @endforeach
                                    @endif
                                </select>
                            </div>
                        </div>
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
