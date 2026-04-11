@extends('layouts.master')
@section('css')
@section('title')
    {{ trans('admin/teacher_trans.Teachers') }}
@stop
@endsection

@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">


            <div class="card-body">

                <a href="{{ route('teachers.create') }}" class="btn btn-success btn-sm" role="button"
                    aria-pressed="true">{{ trans('admin/teacher_trans.Add_Teacher') }}</a><br><br>
                <div class="table-responsive">

                    <table id="datatable" class="table  table-hover table-sm table-bordered p-0" data-page-length="50"
                        style="text-align: center">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ trans('admin/teacher_trans.Teacher_Name') }}</th>
                                <th>{{ trans('admin/teacher_trans.Gender') }}</th>
                                <th>{{ trans('admin/teacher_trans.Joining_Date') }}</th>
                                <th>{{ trans('admin/teacher_trans.Subject') }}</th>
                                <th>{{ trans('admin/teacher_trans.Number_Of_Sections') }}</th>
                                <th>{{ trans('admin/teacher_trans.Processes') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $i = 0; ?>
                            @foreach ($teachers as $teacher)
                                <tr>
                                    <?php $i++; ?>
                                    <td>{{ $i }}</td>
                                    <td>{{ $teacher->name }}</td>

                                    @if ($teacher->gender == 'male')
                                        <td>{{ trans('admin/teacher_trans.Male') }}</td>
                                    @else
                                        <td>{{ trans('admin/teacher_trans.Female') }}</td>
                                    @endif

                                    <td>{{ $teacher->joining_date }}</td>
                                    <td>{{ $teacher->subject }}</td>

                                    <td>{{ $teacher->sections()->count() }}</td>

                                    <td>
                                        <a href="{{ route('teachers.edit', $teacher->id) }}"
                                            class="btn btn-info btn-sm" role="button" aria-pressed="true"><i
                                                class="fa fa-edit"></i></a>
                                        <button type="button" class="btn btn-danger btn-sm" data-toggle="modal"
                                            data-target="#delete_Teacher{{ $teacher->id }}"
                                            title="{{ trans('admin/teacher_trans.Delete') }}"><i
                                                class="fa fa-trash"></i></button>
                                    </td>
                                </tr>

                                <div class="modal fade" id="delete_Teacher{{ $teacher->id }}" tabindex="-1"
                                    role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                    <div class="modal-dialog" role="document">
                                        <form action="{{ route('teachers.destroy', 'test') }}" method="post">
                                            {{ method_field('delete') }}
                                            {{ csrf_field() }}
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h5 style="font-family: 'Cairo', sans-serif;" class="modal-title"
                                                        id="exampleModalLabel">
                                                        {{ trans('admin/teacher_trans.Delete_Teacher') }}
                                                    </h5>
                                                    <button type="button" class="close" data-dismiss="modal"
                                                        aria-label="Close">
                                                        <span aria-hidden="true">&times;</span>
                                                    </button>
                                                </div>
                                                <div class="modal-body">
                                                    <p> {{ trans('admin/teacher_trans.Warning_Teachers') }}
                                                    </p>
                                                    <input type="hidden" name="id" value="{{ $teacher->id }}">
                                                </div>
                                                <div class="modal-footer">
                                                    <div class="modal-footer">
                                                        <button type="button" class="btn btn-secondary"
                                                            data-dismiss="modal">{{ trans('admin/teacher_trans.Close') }}</button>
                                                        <button type="submit"
                                                            class="btn btn-danger">{{ trans('admin/teacher_trans.Submit') }}</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            @endforeach
                    </table>
                </div>
            </div>

        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')
<script>
    $(function() {
        $('#datatable').DataTable({
            searching: true,
            
        });
    });
</script>
@endpush
