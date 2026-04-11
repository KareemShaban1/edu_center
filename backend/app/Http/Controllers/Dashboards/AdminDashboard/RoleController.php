<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class RoleController extends Controller
{
    public function index()
    {

        $roles = Role::where('name', '!=', 'Super Admin')->get();
        $permissions = Permission::all();
        return view('dashboards.admin.roles.index', compact('roles', 'permissions'));
    }
    public function data()
    {
        $roles = Role::with('permissions')
            ->where('name', '!=', 'Super Admin')->get();
        return DataTables::of($roles)
            ->addColumn('actions', function ($role) {
                $permissions = $role->permissions->pluck('id')->toArray();
                $permissionsJson = htmlspecialchars(json_encode($permissions), ENT_QUOTES, 'UTF-8');

                $btn = '';
                $btn .= ' <a href="javascript:void(0)" onclick="editRole(' . $role->id . ', \'' . $role->name . '\', ' . $permissionsJson . ')" class="btn btn-sm btn-info">
                <i class="fa fa-edit"></i>
            </a>';

                $btn .= ' <a href="javascript:void(0)" onclick="deleteRole(' . $role->id . ')" class="btn btn-sm btn-danger">
                <i class="fa fa-trash"></i>
            </a>';
                return $btn;
            })
            ->addColumn('permissions_count', function ($role) {
                return $role->permissions->count();
            })
            ->rawColumns(['actions', 'permissions_count'])
            ->make(true);
    }


    public function create()
    {

        $permissions = Permission::all();
        return view('dashboards.admin.roles.create', compact('permissions'));
    }

    public function store(Request $request)
    {

        $role = Role::create(['name' => $request->name]);
        $role->syncPermissions($request->permissions);

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => __('messages.' . class_basename(Role::class) . ' created successfully'),
                'data' => $role
            ]);
        }

        return redirect()->route('roles.index');
    }

    public function edit(Role $role)
    {

        $permissions = Permission::all(); // Retrieve all permissions
        $role->load('permissions'); // Eager load the role's permissions
        return response()->json([
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }


    public function update(Request $request, Role $role)
    {

        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->permissions);

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => __('messages.' . class_basename(Role::class) . ' updated successfully'),
                'data' => $role
            ]);
        }

        return redirect()->route('roles.index');
    }

    public function destroy(Request $request, Role $role)
    {
        $role->delete();
        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => __('messages.' . class_basename(Role::class) . ' deleted successfully'),
                'data' => $role
            ]);
        }

        return redirect()->route('roles.index');
    }
}
