@extends('layouts.master')

@section('title')
{{ trans('admin/homework_trans.Homeworks') }}
@stop

@section('css')
<link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
@endsection

@section('page-header')
{{ trans('admin/homework_trans.Homeworks') }}
@endsection

@section('content')
<div class="container">
    <button class="btn btn-success mb-3" onclick="openCreateModal()">
        {{ trans('admin/homework_trans.Add_Homework') }}

    </button>

    <table id="homeworkTable" class="table table-hover table-sm table-bordered p-0" data-page-length="50"
        style="text-align: center">
        <thead style="text-align: center">
            <tr>
                <th>{{ trans('admin/homework_trans.Title') }}</th>
                <th>{{ trans('admin/homework_trans.Grade') }}</th>
                <th>{{ trans('admin/homework_trans.Class') }}</th>
                <th>{{ trans('admin/homework_trans.Section') }}</th>
                <th>{{ trans('admin/homework_trans.Submit_Date') }}</th>
                <th>{{ trans('admin/homework_trans.Due_Date') }}</th>
                <th>{{ trans('admin/homework_trans.Actions') }}</th>
            </tr>
        </thead>
    </table>
</div>

<!-- Modal -->
<div class="modal fade" id="homeworkModal" tabindex="-1" aria-labelledby="homeworkModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <form id="homeworkForm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="homeworkModalLabel">{{ trans('admin/homework_trans.Add_Homework') }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    @csrf
                    <input type="hidden" name="id" id="homework_id">
                    <div class="mb-3">
                        <label for="title">{{ trans('admin/homework_trans.Title') }}</label>
                        <input type="text" class="form-control" id="title" name="title" required>
                    </div>
                    <div class="mb-3">
                        <label for="content">{{ trans('admin/homework_trans.Content') }}</label>
                        <textarea class="form-control" id="content" name="content" required></textarea>
                    </div>

                    <div class="mb-3">
                        <label for="grade_id">{{ trans('admin/homework_trans.Grade') }}</label>
                        <select name="grade_id" id="grade_id" class="form-control">
                            <option value="">{{ trans('admin/homework_trans.Select_Grade') }}</option>
                            @foreach ($grades as $grade)
                            <option value="{{ $grade->id }}">{{ $grade->grade_name }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="class_id">{{ trans('admin/homework_trans.Class') }}</label>
                        <select name="class_id" id="class_id" class="form-control">
                            <option value="">{{ trans('admin/homework_trans.Select_Class') }}</option>

                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="section_id">{{ trans('admin/homework_trans.Section') }}</label>
                        <select name="section_id" id="section_id" class="form-control">
                            <option value="">{{ trans('admin/homework_trans.Select_Section') }}</option>

                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="submit_date">{{ trans('admin/homework_trans.Submit_Date') }}</label>
                        <input type="datetime-local" class="form-control" id="submit_date" name="submit_date" required>
                    </div>
                    <div class="mb-3">
                        <label for="due_date">{{ trans('admin/homework_trans.Due_Date') }}</label>
                        <input type="datetime-local" class="form-control" id="due_date" name="due_date" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">{{ trans('admin/homework_trans.Save') }}</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ trans('admin/homework_trans.Cancel') }}</button>
                </div>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')

<script>
    let table;

    $(document).ready(function() {
        table = $('#homeworkTable').DataTable({
            processing: true,
            serverSide: true,
            ajax: '{{ route("homework.index") }}',
            columns: [{
                    data: 'title',
                    name: 'title'
                },
                {
                    data: 'grade',
                    name: 'grade'
                },
                {
                    data: 'class',
                    name: 'class'
                },
                {
                    data: 'section',
                    name: 'section'
                },
                {
                    data: 'submit_date',
                    name: 'submit_date'
                },
                {
                    data: 'due_date',
                    name: 'due_date'
                },
                {
                    data: 'actions',
                    name: 'actions',
                    orderable: false,
                    searchable: false
                },
            ]
        });

        $('#homeworkForm').on('submit', function(e) {
            e.preventDefault();
            const id = $('#homework_id').val();
            const url = id ? `/homework/${id}` : `/homework`;
            const method = id ? 'put' : 'post';

            $.ajax({
                url: url,
                method: method,
                data: $(this).serialize(),
                success: function() {
                    $('#homeworkModal').modal('hide');
                    table.ajax.reload();
                },
                error: function(err) {
                    alert('Error saving data.');
                }
            });
        });
    });

    function openCreateModal() {
        $('#homeworkForm')[0].reset();
        $('#homework_id').val('');
        $('#homeworkModalLabel').text('Add Homework');
        $('#homeworkModal').modal('show');
    }

    function editHomework(id) {
    $.ajax({
        url: `/homework/${id}`,
        type: 'GET',
        success: function (row) {
            $('#homeworkForm')[0].reset();

            $('#homework_id').val(row.id);
            $('#title').val(row.title);
            $('#content').val(row.content);
            $('#submit_date').val(row.submit_date.replace(' ', 'T'));
            $('#due_date').val(row.due_date.replace(' ', 'T'));
            $('#homeworkModalLabel').text('Edit Homework');
            $('#homeworkModal').modal('show');

            // First set grade and trigger change
            $('#grade_id').val(row.grade_id).trigger('change');

            // Wait for class list to be populated
            const waitForClassOptions = new Promise((resolve) => {
                const interval = setInterval(() => {
                    if ($('#class_id option').length > 1) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100); // check every 100ms
            });

            waitForClassOptions.then(() => {
                $('#class_id').val(row.class_id).trigger('change');

                // Wait for section list too
                const waitForSectionOptions = new Promise((resolve) => {
                    const interval = setInterval(() => {
                        if ($('#section_id option').length > 0) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });

                waitForSectionOptions.then(() => {
                    $('#section_id').val(row.section_id);
                });
            });
        },
        error: function () {
            alert('Failed to fetch homework details');
        }
    });
}

</script>
@endpush