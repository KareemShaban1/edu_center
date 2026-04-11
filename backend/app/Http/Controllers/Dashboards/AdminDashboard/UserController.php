<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Yajra\DataTables\Facades\DataTables;

class UserController extends Controller
{
    //
     /**
     * Display a listing of the resource.
     */
    public function index()
    {

        // $roles = Role::all();
        return view('dashboards.admin.users.index');
    }

    /**
     * Fetch data for DataTables.
     */
    public function data()
    {
        $query = User::get();

        return DataTables::of($query)
            ->editColumn('name', function ($user) {
                return $user->name;
            })
            ->addColumn('action', function ($user) {
                $btn = '<div class="d-flex gap-2">';
                    $btn .= '<button onclick="editUser(' . $user->id . ')" class="btn btn-sm btn-info">
                        <i class="fa fa-edit"></i>
                    </button>';

                    $btn .= '<button onclick="deleteUser(' . $user->id . ')" class="btn btn-sm btn-danger">
                        <i class="fa fa-trash" ></i>
                    </button>';

                $btn .= '</div>';

                return $btn;
            })

            ->rawColumns(['action'])
            ->make(true);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'phone' => 'required|string|max:255',
            // 'roles' => 'required|array',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        // $user->syncRoles($request->roles);

        return response()->json(['success' => true, 'message' =>  __('messages.User created successfully')]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:8',
            'phone' => 'required|string|max:255',
            // 'roles' => 'required|array',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password ? Hash::make($request->password) : $user->password,
        ]);

        // $user->syncRoles($request->roles);

        return response()->json(['success' => true, 'message' =>  __('messages.User updated successfully')]);
    }


    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {

        $user->delete();

        return response()->json(['success' => true, 'message' =>  __('messages.User deleted successfully')]);
    }

    public function edit($id)
    {
        try {

            // Retrieve the user by ID
            $user = User::findOrFail($id);

            // Return a view to edit the user details
            return response()->json($user);
        } catch (ModelNotFoundException $e) {
            // Handle the case where the user is not found
            return redirect()->route('users.index')->with('error', 'User not found.');
        }
    }

    public function show($id)
    {

        $user = User::findOrFail($id);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
        ]);
    }

    public function changePassword(Request $request)
    {


        $validated = $request->validate([
            'password' => 'required|min:8',
            'confirm_password' => 'required|same:password',
        ]);

        $user = User::findOrFail(auth()->user()->id);
        $user->password = Hash::make($request->password);
        $user->save();


        return redirect()->route('users.change-password.view')->with('success', __('messages.Password changed successfully'));
    }

}
