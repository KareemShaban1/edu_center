<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{

    public function index()
    {
        $admin = User::findOrFail(auth()->user()->id);
        return view('dashboards.admin.profile', compact('admin'));
    }


    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'Name' => 'required|string|max:255',
            'password' => 'nullable|string|min:6|confirmed',
        ], [
            'Name.required' => 'الاسم مطلوب',
            'Name.string' => 'الاسم يجب أن يكون نصًا',
            'Name.max' => 'الاسم يجب ألا يتجاوز 255 حرفًا',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'password.confirmed' => 'كلمة المرور وتأكيد كلمة المرور غير متطابقين',
        ]);

        $admin = User::findOrFail($id);

        if (!empty($data['password'])) {
            $admin->name = $data['Name'];
            $admin->password = Hash::make($data['password']);
            $admin->save();
        } else {
            $admin->name = $data['Name'];
            $admin->save();
        }
        return redirect()->back()->with('toast_success', 'Profile updated successfully');
    }
}
