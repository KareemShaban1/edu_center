<?php

namespace App\Http\Controllers\Dashboards\TeacherDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TeacherProfileController extends Controller
{
    public function index()
    {
        $teacher = Teacher::findOrFail(auth()->user()->id);
        return view('dashboards.teacher.profile', compact('teacher'));
    }

    public function update(UpdateProfileRequest $request, $id)
    {
        $data = $request->validated();

        $teacher = Teacher::findOrFail($id);

        if (!empty($data['password'])) {
            $teacher->name = ['en' => $data['Name_en'], 'ar' => $data['Name_ar']];
            $teacher->password = Hash::make($data['password']);
            $teacher->save();
        } else {
            $teacher->name = ['en' => $data['Name_en'], 'ar' => $data['Name_ar']];
            $teacher->save();
        }
        return redirect()->back()->with('toast_success', 'Profile updated successfully');
    }
}
