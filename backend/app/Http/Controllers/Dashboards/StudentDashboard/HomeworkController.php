<?php

namespace App\Http\Controllers\Dashboards\StudentDashboard;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Models\Student;
use App\Models\StudentHomework;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class HomeworkController extends Controller
{
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = Homework::where('section_id', auth()->user()->section_id)
                ->with(['grade', 'class', 'section', 'studentHomework'])
                ->select(['id', 'title', 'grade_id', 'class_id', 'section_id', 'submit_date', 'due_date']);
    
            // ✅ Filter by start_date
            if ($request->filled('start_date')) {
                $query->whereDate('submit_date', '>=', $request->start_date);
            }
    
            // ✅ Filter by end_date
            if ($request->filled('end_date')) {
                $query->whereDate('due_date', '<=', $request->end_date);
            }
    
            // ✅ Filter by month_year (format: YYYY-MM)
            if ($request->filled('month_year')) {
                [$year, $month] = explode('-', $request->month_year);
                $query->whereYear('submit_date', $year)
                      ->whereMonth('submit_date', $month);
            }
    
            $homeworks = $query->latest()->get();
    
            // ✅ Transform JSON response
            $data = $homeworks->map(function ($hw) {
                return [
                    'id' => $hw->id,
                    'title' => $hw->title,
                    'grade' => optional($hw->grade)->grade_name,
                    'class' => optional($hw->class)->class_name,
                    'section' => optional($hw->section)->section_name,
                    'submit_date' => $hw->submit_date ? \Carbon\Carbon::parse($hw->submit_date)->format('Y-m-d H:i') : null,
                    'due_date' => $hw->due_date ? \Carbon\Carbon::parse($hw->due_date)->format('Y-m-d H:i') : null,
                    'actions' => route('student_homework.view', $hw->id),
                ];
            });
    
            return response()->json(['data' => $data]);
        }
    
        return view('dashboards.student.homework.index');
    }
    

    public function view($id)
    {
        $homework = Homework::findOrFail($id);
        $student = Student::find(auth()->user()->id);
        $submission = StudentHomework::where('student_id', auth()->id())
            ->where('homework_id', $homework->id)
            ->first();
        return view(
            'dashboards.student.homework.view',
            compact('homework', 'student', 'submission')
        );
    }


    public function storeStudentHomework(Request $request)
    {
        // dd($request->all());

        try {
            $request->validate([
                'student_id' => 'required|exists:students,id',
                'homework_id' => 'required|exists:homeworks,id',
                'files' => 'required|array',
                'files.*' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'notes' => 'nullable|string',
            ]);

            $homework = Homework::findOrFail($request->homework_id);
            $now = now();

            $status = 'submitted';
            if ($now->gt($homework->due_date)) {
                $status = 'late';
            }

            $submission = StudentHomework::updateOrCreate(
                [
                    'student_id' => $request->student_id,
                    'homework_id' => $request->homework_id,
                ],
                [
                    'upload_date_time' => $now,
                    'status' => $status,
                    'student_notes' => $request->notes,
                ]
            );

            // Clear old media before adding new file
            $submission->clearMediaCollection('homework_files');

            foreach ($request->file('files', []) as $file) {
                $submission->addMedia($file)->toMediaCollection('homework_files');
            }


            return back()->with('toast_success', 'Homework submitted successfully!');
        } catch (\Throwable $th) {
            //throw $th;
            dd($th->getMessage());
            return back()->with('toast_error', 'Failed to submit homework: ' . $th->getMessage());
        }
    }
}
