<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Http\Requests\StoreHomeworkRequest;
use App\Http\Requests\UpdateHomeworkRequest;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentHomework;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class HomeworkController extends Controller
{
 
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $homeworks = Homework::select(['id', 'title' ,'content','grade_id', 'class_id', 'section_id', 'submit_date', 'due_date']);
    
            return DataTables::of($homeworks)
                ->addColumn('grade', function ($row) {
                    return $row->grade->grade_name;
                })
                ->addColumn('class', function ($row) {
                    return $row->class->class_name;
                })
                ->addColumn('section', function ($row) {
                    return $row->section->section_name;
                })
                ->addColumn('actions', function ($row) {
                    return '<button class="btn btn-sm btn-info" onclick="editHomework(' . $row->id . ')">Edit</button>';
                })
                ->rawColumns(['actions'])
                ->make(true);
        }

        $grades = Grade::all();
    
        return view('dashboards.admin.homework.index', compact('grades'));
    }
    
    public function show($id)
{
    $homework = Homework::with('grade', 'class', 'section')->findOrFail($id);
    return response()->json($homework);
}

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required',
            'content' => 'required',
            'class_id' => 'required|exists:classes,id',
            'section_id' => 'required|exists:sections,id',
            'submit_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:submit_date',
        ]);
    
        Homework::create($request->all());
    
        return response()->json(['success' => true]);
    }
    
    public function update(Request $request, $id)
    {
        $homework = Homework::findOrFail($id);
    
        $request->validate([
            'title' => 'required',
            'content' => 'required',
            'class_id' => 'required|exists:classes,id',
            'section_id' => 'required|exists:sections,id',
            'submit_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:submit_date',
        ]);
    
        $homework->update($request->all());
    
        return response()->json(['success' => true]);
    }
    

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Homework  $homework
     * @return \Illuminate\Http\Response
     */
    public function destroy(Homework $homework)
    {
        //
    }

    
    public function showGroups()
    {
        // get all grades with sections and number of students in each section
        $grades = Grade::with(['sections' => function ($query) {
            $query->with(['students' => function ($query) {
                $query->count();
            }]);
        }])->get();
        return view('dashboards.admin.homework.show_groups', compact('grades'));
    }





    // choose homework day if there is many homework days
    public function choose_homework_day($id)
    {
        $homeworks = Homework::where('section_id', $id)->get();
        return view('dashboards.admin.homework.choose_homework_day', compact('homeworks'));
    }

    public function show_homework_degree($section_id, $submit_date)
    {
        $homework = Homework::where('section_id', $section_id)
        ->where('submit_date', $submit_date)->first();
        $students = Student::with('homework')->where('section_id', $section_id)->get();
        $section = Section::find($section_id);
        return view('dashboards.admin.homework.show_homework_data', 
        compact('homework', 'students', 'submit_date', 'section'));
    }

    public function storeUpdateHomeworkDegree(Request $request)
    {
        $request->validate([
            'degree' => 'nullable|numeric',
            'rate' => 'nullable',
            'response' => 'nullable',
            'student_id' => 'required',
            'grade_id' => 'required',
            'class_id' => 'required',
            'section_id' => 'required',
            'submit_date' => 'required',
            'status' => 'required',
        ]);

        $studentHomework = StudentHomework::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'homework_id' => $request->homework_id,
            ],
            [
                'degree' => $request->degree,
                'rate' => $request->rate,
                'response' => $request->response,
                'status' => $request->status,
            ]
        );


        return redirect()->back()
        ->with('toast_success', 'تم حفظ درجة التمرين بنجاح');
    }

}
