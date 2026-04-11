@extends('platform.layouts.app')

@section('title', 'Tenants')

@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">{{__('Tenants')}}</h1>
        <a href="{{ route('platform.tenants.create') }}" class="btn btn-primary">
            <i class="fas fa-plus"></i> {{__('Add New Tenant')}}
        </a>
    </div>

    <div class="card">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>{{__('Name')}}</th>
                            <th>{{__('Subdomain')}}</th>
                            <th>{{__('Email')}}</th>
                            <th>{{__('Phone')}}</th>
                            <th>{{__('City')}}</th>
                            <th>{{__('Status')}}</th>
                            <th>{{__('Actions')}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($tenants as $tenant)
                            <tr>
                                <td>{{ $tenant->tenantInfo?->name }}</td>
                                <td>{{ $tenant->tenantInfo?->subdomain }}</td>
                                <td>{{ $tenant->tenantInfo?->email }}</td>
                                <td>{{ $tenant->tenantInfo?->phone ?? '-' }}</td>
                                <td>{{ $tenant->tenantInfo?->city ?? '-' }}</td>
                                <td>
                                    <span
                                        class="badge bg-{{ $tenant->tenantInfo?->status == 1 ? 'success' : ($tenant->tenantInfo?->status == 2 ? 'danger' : 'warning') }} text-white">
                                        {{ $tenant->tenantInfo?->status == 1 ? __('Active') : ($tenant->tenantInfo?->status == 2 ? __('Suspended') : __('Inactive')) }}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group">
                                        <a href="{{ route('platform.tenants.edit', $tenant->id) }}"
                                            class="btn btn-sm btn-info">
                                            <i class="fas fa-edit"></i>
                                        </a>
                                        <form action="{{ route('platform.tenants.toggle-status', $tenant->id) }}"
                                            method="POST" class="d-inline">
                                            @csrf
                                            @method('PATCH')
                                            <button type="submit" class="btn btn-sm btn-warning">
                                                <i class="fas fa-sync"></i>
                                            </button>
                                        </form>
                                        <form action="{{ route('platform.tenants.destroy', $tenant->id) }}" method="POST"
                                            class="d-inline"
                                            onsubmit="return confirm('Are you sure you want to delete this tenant?');">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn btn-sm btn-danger">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center">{{__('No tenants found')}}.</td>
                            </tr>
                        @endforelse
                    </tbody>    
                </table>
            </div>
        </div>
    </div>
@endsection
