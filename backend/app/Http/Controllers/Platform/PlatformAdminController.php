<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Jobs\SetupCenter;
use App\Models\Platform\Center;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformAdminController extends Controller
{
    public function index()
    {
        $centers = Center::query()->orderByDesc('created_at')->get();

        return view('platform.tenants.index', compact('centers'));
    }

    public function create()
    {
        return view('platform.tenants.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:centers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'subdomain' => 'required|string|unique:centers,slug|max:50|alpha_dash',
        ]);

        $center = Center::query()->create([
            'id' => $request->subdomain,
            'name' => $request->name,
            'slug' => $request->subdomain,
            'domain' => $request->subdomain,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'status' => 1,
            'data' => ['plan' => 'Starter'],
        ]);

        SetupCenter::dispatch($center);

        return redirect()->route('platform.tenants.index')
            ->with('toast_success', 'Center created successfully');
    }

    public function edit($id)
    {
        $center = Center::query()->findOrFail($id);

        return view('platform.tenants.edit', compact('center'));
    }

    public function update(Request $request, $id)
    {
        $center = Center::query()->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('centers', 'email')->ignore($center->id, 'id')],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'subdomain' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('centers', 'slug')->ignore($center->id, 'id')],
            'status' => 'required|in:0,1,2',
        ]);

        $center->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'slug' => $request->subdomain,
            'domain' => $request->subdomain,
            'status' => (int) $request->status,
        ]);

        return redirect()->route('platform.tenants.index')
            ->with('toast_success', 'Center updated successfully');
    }

    public function destroy($id)
    {
        Center::query()->findOrFail($id)->delete();

        return redirect()->route('platform.tenants.index')
            ->with('toast_success', 'Center deleted successfully');
    }

    public function toggleStatus($id)
    {
        $center = Center::query()->findOrFail($id);
        $center->update(['status' => (int) $center->status === 1 ? 2 : 1]);

        return redirect()->back()->with('toast_success', 'Center status updated successfully');
    }
}
