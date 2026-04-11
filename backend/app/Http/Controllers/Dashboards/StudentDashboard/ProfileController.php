<?php

namespace App\Http\Controllers\Dashboards\StudentDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{

    public function index()
    {
        $student = Student::findOrFail(auth()->user()->id);
        return view('dashboards.student.profile', compact('student'));
    }


    public function create()
    {
        //
    }


    public function store(Request $request)
    {
        //
    }


    public function show($id)
    {
        //
    }


    public function edit($id)
    {
        //
    }


    public function update(UpdateProfileRequest $request, $id)
    {
        $data = $request->validated();
        $student = Student::findOrFail($id);

        if (!empty($data['password'])) {
            $student->name = ['en' => $data['Name_en'], 'ar' => $data['Name_ar']];
            $student->password = Hash::make($data['password']);
            $student->save();
        } else {
            $student->name = ['en' => $data['Name_en'], 'ar' => $data['Name_ar']];
            $student->save();
        }
        return redirect()->back()->with('toast_success', 'Profile updated successfully');
    }


    public function destroy($id)
    {
        //
    }
}
