<?php


namespace App\Repository\Admin;


use App\Models\Fee;
use App\Models\Grade;
use App\Models\Months;

class FeesRepository implements FeesRepositoryInterface
{

    public function index()
    {

        $Fees = Fee::all();
        $Grades = Grade::all();
        return view('dashboards.admin.fees.index', compact('Fees', 'Grades'));
    }

    public function create()
    {

        $grades = Grade::all();
        $months = Months::all();
        return view('dashboards.admin.fees.add', compact('grades', 'months'));
    }

    public function edit($id)
    {

        $fee = Fee::findorfail($id);
        $grades = Grade::all();
        $months = Months::all();
        return view('dashboards.admin.fees.edit', compact('fee', 'grades', 'months'));
    }


    public function store($request)
    {
        try {

            $fees = new Fee();
            $fees->title = ['ar' => $request->title];
            $fees->amount  = $request->amount;
            $fees->grade_id  = $request->grade_id;
            $fees->class_id  = $request->class_id;
            $fees->section_id  = $request->section_id;
            $fees->description  = $request->description;
            $fees->month = $request->month;
            $fees->year  = $request->year;
            $fees->Fee_type  = $request->Fee_type;
            $fees->save();
            return redirect()->route('fees.index')
            ->with('toast_success','Fees added successfully');
        } catch (\Exception $e) {
            return redirect()->back()
            ->with('toast_error',__('Fees added failed'))
            ->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function update($request)
    {
        try {
            $fees = Fee::findOrFail($request->id);
            $fees->title = ['ar' => $request->title];
            $fees->amount  = $request->amount;
            $fees->grade_id  = $request->grade_id;
            $fees->class_id  = $request->class_id;
            $fees->section_id  = $request->section_id;
            $fees->description  = $request->description;
            $fees->month = $request->month;
            $fees->year  = $request->year;
            $fees->Fee_type  = $request->Fee_type;
            $fees->save();
            return redirect()->route('fees.index')
            ->with('toast_success','Fees Updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()
            ->with('toast_error',__('Fees updated failed'))
            ->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy($request)
    {
        try {
            Fee::destroy($request->id);
            return redirect()->back()
            ->with('toast_success','Fees deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()
            ->with('toast_error',__('Fees deleted failed'))
            ->withErrors(['error' => $e->getMessage()]);
        }
    }
}
