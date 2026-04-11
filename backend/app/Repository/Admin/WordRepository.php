<?php

namespace App\Repository\Admin;


use App\Http\Requests\StoreGradesRequest;
use App\Http\Requests\StoreWordRequest;
use App\Http\Requests\UpdateWordRequest;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\Word;
use App\Models\Unit;
use Illuminate\Http\Request;

class WordRepository implements WordRepositoryInterface
{


  public function index()
  {
    // get all words
    $words = Word::all();
    return view('dashboards.admin.words.index', compact('words', 'units'));
  }

  public function show($id)
  {
    $word = Word::findOrFail($id);

    return view('dashboards.admin.words.show', compact('word'));
  }

  public function store($request)
  {

    try {
      $validatedData = $request->validated();
      Word::create($validatedData);

      return redirect()->back()
        ->with('toast_success', 'Word added successfully');
    } catch (\Exception $e) {

      return redirect()->back()
        ->with('toast_error', __('Word added failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }

  public function storeMultiple($request)
{
    try {
        $lessonId = $request->input('lesson_id');
        $words = $request->input('words');

        foreach ($words as $wordData) {
            Word::create([
                'lesson_id' => $lessonId,
                'word' => $wordData['word'],
                'translation' => $wordData['translation'],
                'type' => $wordData['type'],
            ]);
        }

        return redirect()->back()->with('toast_success', 'Words added successfully');
    } catch (\Exception $e) {
        return redirect()->back()->with('toast_error', 'Failed to add words')->withErrors(['error' => $e->getMessage()]);
    }
}



  public function update($request,$id)
  {

    try {

      $validatedData = $request->validated();
      $word = Word::findOrFail($id);
      $word->update($validatedData);
      
      return redirect()->back()
        ->with('toast_success', 'Word Updated successfully');
    } catch (\Exception $e) {
      return redirect()->back()
        ->with('toast_error', __('Word updated failed'))
        ->withErrors(['error' => $e->getMessage()]);
    }
  }


  public function destroy($id)
  {
   try {
    $word = Word::findOrFail($id);
    $word->delete();
    return redirect()->back()
      ->with('toast_success', 'Word deleted successfully');
   } catch (\Exception $e) {
    return redirect()->back()
      ->with('toast_error', __('Word deleted failed'))
      ->withErrors(['error' => $e->getMessage()]);
   }
  }
}
