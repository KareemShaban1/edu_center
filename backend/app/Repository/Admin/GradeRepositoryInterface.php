<?php 

namespace App\Repository\Admin;

use App\Http\Requests\StoreGradesRequest;
use Illuminate\Http\Request;

interface GradeRepositoryInterface {

          public function index();

          // public function create();
      
          // public function edit($id);
      
          public function store(StoreGradesRequest $request);
      
          public function update(StoreGradesRequest $request);
      
          public function destroy(Request $request);
}