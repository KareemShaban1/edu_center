<?php

namespace App\Repository\Admin;


use App\Http\Requests\StoreGradesRequest;
use App\Http\Requests\StoreUnitRequest;
use App\Http\Requests\UpdateUnitRequest;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitRepository implements UnitRepositoryInterface
{


  public function index()
  {
    // get all units
    $units = Unit::with('classes')->get();
    return view('dashboards.admin.units.index', compact('units'));
  }

  public function store(StoreUnitRequest $request)
  {

    try {
      $request->validated();
      $unit = new Unit();
      $unit->name = $request->name;
      $unit->class_id = $request->class_id;
      $unit->notes = $request->notes;

      $unit->save();


      return redirect()->back()
        ->with('toast_success', 'Unit added successfully');
    } catch (\Exception $e) {
      return redirect()->back()
        ->with('toast_error', __('Unit added failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }


  public function update(UpdateUnitRequest $request)
  {

    try {

      // $request->validated();
      $unit = Unit::findOrFail($request->id);
      $unit->update([
        'name' => $request->name,
        // 'class_id' => $request->class_id ? $request->class_id : $unit->class_id,
        'notes' => $request->notes,
      ]);
      return redirect()->back()
        ->with('toast_success', 'Unit Updated successfully');
    } catch (\Exception $e) {
      return redirect()->back()
        ->with('toast_error', __('Unit updated failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }


  public function destroy(Request $request)
  {
    $unit = Unit::findOrFail($request->id)->delete();
    return redirect()->route('units.index')
      ->with('toast_success', 'Unit deleted successfully');
  }
}
