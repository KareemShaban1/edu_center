<?php 

namespace App\Repository\Admin;

use App\Http\Requests\StoreUnitRequest;
use App\Http\Requests\UpdateUnitRequest;
use Illuminate\Http\Request;

interface UnitRepositoryInterface {

          public function index();

          // public function create();
      
          // public function edit($id);
      
          public function store(StoreUnitRequest $request);
      
          public function update(UpdateUnitRequest $request);
      
          public function destroy(Request $request);
}