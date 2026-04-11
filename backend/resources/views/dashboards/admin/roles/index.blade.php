@extends('layouts.master')

@section('content')
<div class="container-fluid">
    <!-- start page title -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box">
                <div class="page-title-right">
                    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addRoleModal">
                        <i class="mdi mdi-plus"></i> {{__('Add Role')}}
                    </button>
                </div>
                <h4 class="page-title">{{__('Roles')}}</h4>
            </div>
        </div>
    </div>
    <!-- end page title -->

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <table id="roles-table" class="table dt-responsive nowrap w-100">
                        <thead>
                            <tr>
                                <th>{{__('ID')}}</th>
                                <th>{{__('Name')}}</th>
                                <th>{{__('Permissions Count')}}</th>
                                <th>{{__('Actions')}}</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add Role Modal -->
<x-modal id="addRoleModal" title="{{__('Add Role')}}" size="lg">
    <form id="addRoleForm" method="POST" action="{{ route('roles.store') }}">
        @csrf
        <div class="modal-body">
            <div class="mb-3">
                <label for="name" class="form-label">{{__('Name')}}</label>
                <input type="text" class="form-control" id="name" name="name" required>
                <div class="invalid-feedback"></div>
            </div>
        </div>
        <div class="mb-3 p-1">
            <label for="permissions" class="form-label">{{__('Permissions')}}</label>
            <div id="permissions" class="form-group">
                <div class="form-check" style="margin: 10px;">
                    <input class="form-check-input" type="checkbox" id="select_all_permissions">
                    <label class="form-check-label" for="select_all_permissions">
                        {{__('Select All')}}
                    </label>
                </div>
                <div class="row">

                    @foreach($permissions as $index => $permission)
                    <div class="col-md-3">
                        <div class="form-check">
                            <input class="form-check-input permission-checkbox" type="checkbox" name="permissions[]" value="{{ $permission->name }}" id="permission_{{ $permission->id }}">
                            <label class="form-check-label" for="permission_{{ $permission->id }}">
                                {{ __($permission->name) }}
                            </label>
                        </div>
                    </div>
                    @if(($index + 1) % 4 == 0) <!-- Close and start a new row after every 4 items -->
                </div>
                <div class="row">
                    @endif
                    @endforeach
                </div>
            </div>
        </div>


        <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">{{__('Close')}}</button>
            <button type="submit" class="btn btn-primary">{{__('Save')}}</button>
        </div>
    </form>
</x-modal>

<!-- Edit Role Modal -->
<x-modal id="editRoleModal" title="{{__('Edit Role')}}" size="lg">
    <form id="editRoleForm" method="POST">
        @csrf
        @method('PUT')
        <div class="modal-body">
            <div class="mb-3">
                <label for="edit_name" class="form-label">{{__('Name')}}</label>
                <input type="text" class="form-control" id="edit_name" name="name" required>
                <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3 p-1">
                <label for="permissions" class="form-label">{{__('Permissions')}}</label>
                <div id="permissions" class="form-group">
                    <div class="form-check" style="margin: 10px;">
                        <input class="form-check-input" type="checkbox" id="edit_select_all_permissions">
                        <label class="form-check-label" for="edit_select_all_permissions">
                            {{__('Select All')}}
                        </label>
                    </div>
                    <div class="row">

                        @foreach($permissions as $index => $permission)
                        <div class="col-md-3">
                            <div class="form-check">
                                <input
                                    class="form-check-input permission-checkbox"
                                    type="checkbox"
                                    name="permissions[]"
                                    value="{{ $permission->name }}"
                                    id="permission_{{ $permission->id }}"
                                    @if(isset($role) && $role->permissions->contains($permission->id)) checked @endif>
                                <label class="form-check-label" for="permission_{{ $permission->id }}">
                                    {{ __($permission->name) }}
                                </label>
                            </div>
                        </div>
                        @if(($index + 1) % 4 == 0) <!-- Close and start a new row after every 4 items -->
                    </div>
                    <div class="row">
                        @endif
                        @endforeach

                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">{{__('Close')}}</button>
                <button type="submit" class="btn btn-primary">{{__('Update')}}</button>
            </div>
    </form>
</x-modal>


@endsection

@push('scripts')
<script>
    $(function() {
        // Initialize DataTable
        var table = $('#roles-table').DataTable({
            ajax: {
                url: '{{ route("roles.data") }}',
                error: function(xhr, error, code) {
                    console.log(xhr.responseText); // Inspect the server response
                }
            },
            columns: [{
                    data: 'id',
                    name: 'id'
                },
                {
                    data: 'name',
                    name: 'name'
                },
                {
                    data: 'permissions_count',
                    name: 'permissions_count'
                },
                {
                    data: 'actions',
                    name: 'actions',
                    orderable: false,
                    searchable: false
                }
            ],
            order: [
                [0, 'desc']
            ],
            buttons: [{
                    extend: 'print',
                    exportOptions: {
                        columns: [0, 1, 2]
                    }
                },
                {
                    extend: 'excel',
                    text: 'Excel',
                    title: 'Roles Data',
                    exportOptions: {
                        columns: [0, 1, 2]
                    }
                },
                {
                    extend: 'copy',
                    exportOptions: {
                        columns: [0, 1, 2]
                    }
                },
            ],
            dom: '<"d-flex justify-content-between align-items-center mb-3"lfB>rtip',
            pageLength: 10,
            responsive: true,
            "drawCallback": function() {
                $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
            }
        });

        // Add Role Form Submit
        $('#addRoleForm').on('submit', function(e) {
            e.preventDefault();
            var form = $(this);
            var url = form.attr('action');

            $.ajax({
                url: url,
                type: 'POST',
                data: form.serialize(),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: function(response) {
                    if (response.success) {
                        $('#addRoleModal').modal('hide');
                        $('#addRoleForm')[0].reset();
                        table.ajax.reload();
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: response.message
                        });
                    }
                },
                error: function(xhr) {
                    if (xhr.status === 422) {
                        var errors = xhr.responseJSON.errors;
                        Object.keys(errors).forEach(function(key) {
                            var input = form.find(`[name="${key}"]`);
                            input.addClass('is-invalid');
                            input.siblings('.invalid-feedback').text(errors[key][0]);
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: xhr.responseJSON.message || 'Something went wrong!'
                        });
                    }
                }
            });
        });

        // Edit Role Form Submit
        $('#editRoleForm').on('submit', function(e) {
            e.preventDefault();
            var form = $(this);
            var url = form.attr('action');

            $.ajax({
                url: url,
                type: 'POST',
                data: form.serialize(),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: function(response) {
                    if (response.success) {
                        $('#editRoleModal').modal('hide');
                        $('#editRoleForm')[0].reset();
                        table.ajax.reload();
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: response.message
                        });
                    }
                },
                error: function(xhr) {
                    if (xhr.status === 422) {
                        var errors = xhr.responseJSON.errors;
                        Object.keys(errors).forEach(function(key) {
                            var input = form.find(`[name="${key}"]`);
                            input.addClass('is-invalid');
                            input.siblings('.invalid-feedback').text(errors[key][0]);
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: xhr.responseJSON.message || 'Something went wrong!'
                        });
                    }
                }
            });
        });

        // Clear form validation on modal hide
        $('.modal').on('hidden.bs.modal', function() {
            var form = $(this).find('form');
            form.find('.is-invalid').removeClass('is-invalid');
            form.find('.invalid-feedback').text('');
        });
    });

    // Edit Role Function
    function editRole(id, name, permissions) {
        var form = $('#editRoleForm');
        form.attr('action', `{{ route('roles.update', '') }}/${id}`);
        form.find('#edit_name').val(name);

        // Clear previous selections
        form.find('input[name="permissions[]"]').prop('checked', false);

        // Check the permissions assigned to the role
        permissions.forEach(permissionId => {
            form.find(`#permission_${permissionId}`).prop('checked', true);
        });

        $('#editRoleModal').modal('show');
    }


    function deleteRole(id) {
        console.log(id);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '{{ route("roles.index") }}/' + id,
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') // CSRF token for Laravel
                    },
                    success: function(response) {
                        console.log(response);
                        $('#roles-table').DataTable().ajax.reload();
                        Swal.fire('Deleted!', response.message, 'success');
                    }
                });
            }
        });
    }

    // Select All Checkbox for Add Role Modal
    $('#select_all_permissions').on('change', function() {
        $('.permission-checkbox').prop('checked', this.checked);
    });

    // Update Select All Checkbox State When Individual Checkbox is Clicked
    $('.permission-checkbox').on('change', function() {
        let allChecked = $('.permission-checkbox:checked').length === $('.permission-checkbox').length;
        $('#select_all_permissions').prop('checked', allChecked);
    });

    $('#edit_select_all_permissions').on('change', function() {
        $('.permission-checkbox').prop('checked', this.checked);
    });
    // Select All Checkbox for Edit Role Modal
    $('#editRoleModal').on('shown.bs.modal', function() {
        let allChecked = $('.permission-checkbox:checked').length === $('.permission-checkbox').length;
        $('#edit_select_all_permissions').prop('checked', allChecked);
    });

    // Update Select All Checkbox State When Individual Checkbox is Clicked
    $('.permission-checkbox').on('change', function() {
        let allChecked = $('.permission-checkbox:checked').length === $('.permission-checkbox').length;
        $('#edit_select_all_permissions').prop('checked', allChecked);
    });
</script>
@endpush