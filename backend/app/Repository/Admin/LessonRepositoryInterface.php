<?php 

namespace App\Repository\Admin;

use App\Http\Requests\StoreLessonRequest;
use App\Http\Requests\UpdateLessonRequest;
use Illuminate\Http\Request;

interface LessonRepositoryInterface {

          public function index();

          // public function create();
      
          // public function edit($id);
          
          public function show($id);
      
          public function store(StoreLessonRequest $request);
      
          public function update(UpdateLessonRequest $request);
      
          public function destroy(Request $request);

          public function wordsModel($id);
}