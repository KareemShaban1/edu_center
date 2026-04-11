<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\Tenant;
use App\Models\Platform\TenantInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlatformAdminController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with('tenantInfo')->get();
        return view('platform.tenants.index', compact('tenants'));
    }

    public function create()
    {
        return view('platform.tenants.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenant_infos,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'subdomain' => 'required|string|unique:tenant_infos,subdomain|max:50|alpha_dash',
        ]);

        $tenant = Tenant::firstOrCreate([
            'id' => $request->subdomain
        ]);

        $tenant->tenantInfo()->create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'subdomain' => $request->subdomain,
            'status' => 1
        ]);

        $tenant->domains()->create(['domain' => $request->subdomain]);

        return redirect()->route('platform.tenants.index')
            ->with('toast_success', 'Tenant created successfully');
    }

    public function edit($id)
    {
        $tenant = Tenant::with('tenantInfo')->findOrFail($id);
        return view('platform.tenants.edit', compact('tenant'));
    }

    public function update(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenant_infos,email,' . $tenant->tenantInfo?->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'subdomain' => 'required|string|unique:tenant_infos,subdomain,' . $tenant->tenantInfo?->id . '|max:50|alpha_dash',
            'status' => 'required|in:0,1,2'
        ]);

        $tenant->tenantInfo->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'subdomain' => $request->subdomain,
            'status' => $request->status
        ]);

        return redirect()->route('platform.tenants.index')
            ->with('toast_success', 'Tenant updated successfully');
    }

    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();

        return redirect()->route('platform.tenants.index')
            ->with('toast_success', 'Tenant deleted successfully');
    }

    public function toggleStatus($id)
    {
        $tenant = Tenant::findOrFail($id);
        $currentStatus = $tenant->tenantInfo?->status;

        $newStatus = $currentStatus == 1 ? 2 : 1;

        $tenant->tenantInfo?->update(['status' => $newStatus]);

        return redirect()->back()->with('toast_success', 'Tenant status updated successfully');
    }
}
