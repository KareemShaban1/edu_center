<?php

namespace App\Repository\Admin;


use App\Http\Requests\StoreGradesRequest;
use App\Models\Classes;
use App\Models\Grade;
use Illuminate\Http\Request;

class GradeRepository implements GradeRepositoryInterface
{


  public function index()
  {
    // get all grades
    $Grades = Grade::all();
    return view('dashboards.admin.grades.index', compact('Grades'));
  }

  public function store(StoreGradesRequest $request)
  {

    try {
      $request->validated();
      $grade = new Grade();
      $grade->grade_name = $request->grade_name;
      $grade->Notes = $request->notes;

      $grade->save();


      return redirect()->route('grades.index')
        ->with('toast_success', 'Grade added successfully');
    } catch (\Exception $e) {
      return redirect()->back()
        ->with('toast_error', __('Grade added failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }


  public function update(StoreGradesRequest $request)
  {

    try {

      // $request->validated();
      $grade = Grade::findOrFail($request->id);
      $grade->update([
        $grade->grade_name = $request->grade_name,
        $grade->notes = $request->notes,
      ]);
      return redirect()->route('grades.index')
        ->with('toast_success', 'Grade Updated successfully');
    } catch (\Exception $e) {
      return redirect()->back()
        ->with('toast_error', __('Grade updated failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }


  public function destroy(Request $request)
  {
    $class = Classes::where('Grade_id', $request->id)->pluck('Grade_id');

    if ($class->count() == 0) {

      $Grades = Grade::findOrFail($request->id)->delete();
      return redirect()->route('grades.index')
        ->with('toast_success', 'Grade deleted successfully');
    } else {

      return redirect()->route('grades.index')
        ->with('toast_error', 'Grade has classes, cannot be deleted');
    }
  }
}
