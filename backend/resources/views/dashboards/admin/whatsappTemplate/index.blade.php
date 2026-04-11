@extends('layouts.master')
@section('title', 'WhatsApp Templates')

@section('content')
<div class="container">
    <h3>WhatsApp Templates</h3>
    <button class="btn btn-primary mb-3" data-bs-toggle="modal" data-bs-target="#createModal">Create Template</button>

    <table class="table table-hover table-sm table-bordered p-0" id="templatesTable">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Content</th>
                <th>Placeholders</th>
                <th>Actions</th>
            </tr>
        </thead>
    </table>
</div>

<!-- Create Modal -->
<div class="modal fade" id="createModal" tabindex="-1">
    <div class="modal-dialog">
        <form id="createForm">
            @csrf
            <div class="modal-content">
                <div class="modal-header"><h5 class="modal-title">New Template</h5></div>
                <div class="modal-body">
                    <input type="text" name="name" class="form-control mb-2" placeholder="Template Name" required>
                    <textarea name="content" class="form-control" rows="5"  required></textarea>
                    <div class="alert alert-danger mt-2 d-none" id="createError"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-primary" type="submit">Create</button>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- Edit Modal -->
<div class="modal fade" id="editModal" tabindex="-1">
    <div class="modal-dialog">
        <form id="editForm">
            @csrf
            @method('PUT')
            <input type="hidden" name="id">
            <div class="modal-content">
                <div class="modal-header"><h5 class="modal-title">Edit Template</h5></div>
                <div class="modal-body">
                    <input type="text" name="name" class="form-control mb-2" required>
                    <textarea name="content" class="form-control" rows="5" required></textarea>
                    <div class="alert alert-danger mt-2 d-none" id="editError"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-success" type="submit">Update</button>
                </div>
            </div>
        </form>
    </div>
</div>
@endsection

@section('js')
<script>
    let table;

    $(function () {
        // Load templates
        table = $('#templatesTable').DataTable({
            ajax: '{{ route("whatsapp_templates.index") }}',
            columns: [
                { data: 'id' },
                { data: 'name' },
                { data: 'content' },
                {
                    data: 'variables',
                    render: data => data.join(', ')
                },
                {
                    data: null,
                    render: data => `
                        <button class="btn btn-sm btn-secondary edit-btn" 
                            data-id="${data.id}" 
                            data-name="${data.name}" 
                            data-content="${data.content}">
                            Edit
                        </button>`
                }
            ]
        });

        // Create
        $('#createForm').on('submit', function (e) {
            e.preventDefault();
            const form = $(this);

            $.ajax({
                url: '{{ route("whatsapp_templates.store") }}',
                method: 'POST',
                data: form.serialize(),
                success: () => {
                    $('#createModal').modal('hide');
                    form[0].reset();
                    $('#createError').addClass('d-none');
                    table.ajax.reload();
                },
                error: xhr => {
                    $('#createError').removeClass('d-none').text(xhr.responseJSON.message);
                }
            });
        });

        // Open Edit Modal
        $(document).on('click', '.edit-btn', function () {
            const btn = $(this);
            $('#editForm input[name="id"]').val(btn.data('id'));
            $('#editForm input[name="name"]').val(btn.data('name'));
            $('#editForm textarea[name="content"]').val(btn.data('content'));
            $('#editModal').modal('show');
        });

        // Update
        $('#editForm').on('submit', function (e) {
            e.preventDefault();
            const form = $(this);
            const id = form.find('input[name="id"]').val();

            $.ajax({
                url: `/whatsapp_templates/${id}`,
                method: 'POST',
                data: form.serialize(),
                success: () => {
                    $('#editModal').modal('hide');
                    table.ajax.reload();
                    $('#editError').addClass('d-none');
                },
                error: xhr => {
                    $('#editError').removeClass('d-none').text(xhr.responseJSON.message);
                }
            });
        });
    });
</script>
@endsection
