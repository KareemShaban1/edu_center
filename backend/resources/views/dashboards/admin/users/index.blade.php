@extends('layouts.master')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="page-title-box">
                <div class="page-title-right">
                    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#userModal" onclick="resetForm()">
                        <i class="mdi mdi-plus"></i> {{ __('Add User') }}
                    </button>
                </div>
                <h4 class="page-title">{{ __('Users') }}</h4>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <table id="users-table" class="table dt-responsive nowrap w-100">
                        <thead>
                            <tr>
                                <th>{{ __('ID') }}</th>
                                <th>{{ __('Name') }}</th>
                                <th>{{ __('Email') }}</th>
                                <th>{{ __('Phone') }}</th>
                                <!-- <th>{{ __('Roles') }}</th> -->
                                <th>{{ __('Actions') }}</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- User Modal -->
<x-modal id="userModal" title="{{ __('Add User') }}">
    <form id="userForm" method="POST">
        @csrf
        <input type="hidden" id="userId">
        <div class="modal-body">
            <div class="mb-3">
                <label for="name" class="form-label">{{ __('Name') }}</label>
                <input type="text" class="form-control" id="name" name="name" required>
                <div class="invalid-feedback"></div>
            </div>
            <div class="mb-3">
                <label for="phone" class="form-label">{{ __('Phone') }}</label>
                <input type="text" class="form-control" id="phone" name="phone" required>
                <div class="invalid-feedback"></div>
            </div>
            <div class="mb-3">
                <label for="email" class="form-label">{{ __('Email') }}</label>
                <input type="email" class="form-control" id="email" name="email" required>
                <div class="invalid-feedback"></div>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">{{ __('Password') }}</label>
                <input type="password" class="form-control" id="password" name="password">
                <div class="invalid-feedback"></div>
            </div>
            

        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">{{ __('Close') }}</button>
            <button type="submit" class="btn btn-primary">{{ __('Save') }}</button>
        </div>
    </form>
</x-modal>
@endsection

@push('scripts')
<script>
    let table = $('#users-table').DataTable({
        ajax: '{{ route("users.data") }}',
        columns: [{
                data: 'id',
                name: 'id'
            },
            {
                data: 'name',
                name: 'name'
            },
            {
                data: 'email',
                name: 'email'
            },
           
            {
                data: 'phone',
                name: 'phone'
            },
            {
                data: 'action',
                name: 'action',
                orderable: false,
                searchable: false
            },
        ],
        order: [
            [0, 'desc']
        ],
        buttons: [{
                extend: 'print',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4]
                }
            },
            {
                extend: 'excel',
                text: 'Excel',
                title: 'Users Data',
                exportOptions: {
                    columns: [0, 1, 2, 3]
                }
            },
            // {
            //     extend: 'pdf', 
            //     text: 'PDF', 
            //     title: 'Users Data', 
            //     exportOptions: {
            //         columns: [0, 1, 2, 3]
            //     }
            // },
            {
                extend: 'copy',
                exportOptions: {
                    columns: [0, 1, 2, 3]
                }
            },
        ],
        dom: '<"d-flex justify-content-between align-items-center mb-3"lfB>rtip',
        responsive: true,
        "drawCallback": function() {
            $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
        }
    });

    // Reset form
    function resetForm() {
        $('#userForm')[0].reset();
        $('#userForm').attr('action', '{{ route("users.store") }}');
        $('#userId').val('');
        $('#userModal .modal-title').text('{{ __("Add User") }}');
    }

    // Handle Add/Edit Form Submission
    $('#userForm').on('submit', function(e) {
        e.preventDefault();
        let url = $('#userId').val() ? '{{ route("users.update", ":id") }}'.replace(':id', $('#userId').val()) : '{{ route("users.store") }}';
        let method = $('#userId').val() ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            method: method,
            data: $(this).serialize(),
            success: function(response) {
                $('#userModal').modal('hide');
                table.ajax.reload();
                Swal.fire('Success', response.message, 'success');
            },
            error: function(xhr) {
                // handleValidationErrors(xhr);
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    var errorMessages = Object.values(errors).map(function(error) {
                        return error[0];
                    }).join('<br>');

                    Swal.fire({
                        icon: 'error',
                        title: 'Validation Errors',
                        html: errorMessages
                    });
                }
            },
        });
    });

    // Edit user
    function editUser(id) {
        $.get('{{ route("users.index") }}/' + id, function(data) {
            $('#userId').val(data.id);
            $('#name').val(data.name);
            $('#email').val(data.email);
            $('#phone').val(data.phone);
           
            // Reset all checkboxes
            // $('#roles-container input[type="checkbox"]').prop('checked', false);

            // Check the user's roles
            // data.roles.forEach(role => {
            //     $('#role_' + role).prop('checked', true);
            // });

            $('#userModal .modal-title').text('{{ __("Edit User") }}');
            $('#userModal').modal('show');
        });
    }

    // Delete user
    function deleteUser(id) {
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
                    url: '{{ route("users.index") }}/' + id,
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') // CSRF token for Laravel
                    },
                    success: function(response) {
                        table.ajax.reload();
                        Swal.fire('Deleted!', response.message, 'success');
                    }
                });
            }
        });
    }
</script>
@endpush