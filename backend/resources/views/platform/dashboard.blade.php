@extends('platform.layouts.app')

@section('title', 'Dashboard')

@section('content')
    <div class="row">
        <div class="col-md-12 mb-4">
            <h1 class="h3">{{__('Dashboard')}}</h1>
        </div>
    </div>

    <div class="row">
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{__('Total Tenants')}}</h5>
                    <h2 class="display-4">{{ \App\Models\Platform\Tenant::count() }}</h2>
                </div>
            </div>
        </div>

        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{__('Active Tenants')}}</h5>
                    <h2 class="display-4">{{ \App\Models\Platform\TenantInfo::where('status', 1)->count() }}</h2>
                </div>
            </div>
        </div>

        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{__('Suspended Tenants')}}</h5>
                    <h2 class="display-4">{{ \App\Models\Platform\TenantInfo::where('status', 2)->count() }}</h2>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{__('Recent Tenants')}}</h5>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>{{__('Name')}}</th>
                                    <th>{{__('Subdomain')}}</th>
                                    <th>{{__('Status')}}</th>
                                    <th>{{__('Created')}}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse (\App\Models\Platform\Tenant::with('tenantInfo')->latest()->take(5)->get() as $tenant)
                                    <tr>
                                        <td>{{ $tenant->tenantInfo?->name }}</td>
                                        <td>{{ $tenant->tenantInfo?->subdomain }}</td>
                                        <td>
                                            <span
                                                class="badge bg-{{ $tenant->tenantInfo?->status == 1 ? 'success' : ($tenant->tenantInfo?->status == 2 ? 'danger' : 'warning') }} text-white">
                                                {{ $tenant->tenantInfo?->status == 1 ? __('Active') : ($tenant->tenantInfo?->status == 2 ? __('Suspended') : __('Inactive')) }}
                                            </span>
                                        </td>
                                        <td>{{ $tenant->created_at->diffForHumans() }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="4" class="text-center">{{__('No recent tenants found')}}</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
