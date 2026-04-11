@extends('platform.layouts.app')

@section('title', 'Edit Tenant')

@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">{{ __('Edit Tenant') }}</h1>
        <a href="{{ route('platform.tenants.index') }}" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> {{ __('Back to List') }}
        </a>
    </div>

    <div class="card">
        <div class="card-body">
            <form action="{{ route('platform.tenants.update', $tenant->id) }}" method="POST">
                @csrf
                @method('PUT')
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="name" class="form-label">{{ __('Name') }} <span class="text-danger">*</span></label>
                        <input type="text" class="form-control @error('name') is-invalid @enderror" id="name"
                            name="name" value="{{ old('name', $tenant->tenantInfo?->name) }}" required>
                        @error('name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="col-md-6 mb-3">
                        <label for="email" class="form-label">{{ __('Email') }} <span class="text-danger">*</span></label>
                        <input type="email" class="form-control @error('email') is-invalid @enderror" id="email"
                            name="email" value="{{ old('email', $tenant->tenantInfo?->email) }}" required>
                        @error('email')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="col-md-6 mb-3">
                        <label for="phone" class="form-label">{{ __('Phone') }}</label>
                        <input type="text" class="form-control @error('phone') is-invalid @enderror" id="phone"
                            name="phone" value="{{ old('phone', $tenant->tenantInfo?->phone) }}">
                        @error('phone')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="col-md-6 mb-3">
                        <label for="subdomain" class="form-label">{{ __('Subdomain') }} <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <input type="text" class="form-control @error('subdomain') is-invalid @enderror"
                                id="subdomain" name="subdomain"
                                value="{{ old('subdomain', $tenant->tenantInfo?->subdomain) }}" readonly
                                title="Only lowercase letters, numbers, and hyphens are allowed" required>
                            <span class="input-group-text">.example.com</span>
                        </div>
                        @error('subdomain')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="col-md-6 mb-3">
                        <label for="city" class="form-label">{{ __('City') }}</label>
                        <input type="text" class="form-control @error('city') is-invalid @enderror" id="city"
                            name="city" value="{{ old('city', $tenant->tenantInfo?->city) }}">
                        @error('city')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="col-md-6 mb-3">
                        <label for="status" class="form-label">{{ __('Status') }} <span class="text-danger">*</span></label>
                        <select class="form-select @error('status') is-invalid @enderror" id="status" name="status"
                            required>
                            <option value="0"
                                {{ old('status', $tenant->tenantInfo?->status) == 0 ? 'selected' : '' }}>
                                {{ __('In-Active') }} </option>
                            <option value="1"
                                {{ old('status', $tenant->tenantInfo?->status) == 1 ? 'selected' : '' }}>
                                {{ __('Active') }}</option>
                            <option value="2"
                                {{ old('status', $tenant->tenantInfo?->status) == 2 ? 'selected' : '' }}>
                                {{ __('Suspended') }}</option>
                        </select>
                        @error('status')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="col-12 mb-3">
                        <label for="address" class="form-label">{{ __('Address') }}</label>
                        <textarea class="form-control @error('address') is-invalid @enderror" id="address" name="address" rows="3">{{ old('address', $tenant->tenantInfo?->address) }}</textarea>
                        @error('address')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>

                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> {{ __('Update Tenant') }}
                    </button>
                </div>
            </form>
        </div>
    </div>
@endsection
