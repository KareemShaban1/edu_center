<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    //
    public function index()
    {
        return view('dashboards.admin.Classes.index');
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'nullable',
            'content' => 'required',
            'date_time' => 'required',
            'noteable_id' => 'required',
            'noteable_type' => 'required',
        ]);

        $note = Note::create($validatedData);

        return redirect()->back()
        ->with('toast_success', 'تم أضافة الملاحظة بنجاح');
        // ->with('success', 'Note added successfully');
    }
}
