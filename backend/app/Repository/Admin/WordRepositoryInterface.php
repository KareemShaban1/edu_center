<?php 

namespace App\Repository\Admin;

use App\Http\Requests\StoreWordRequest;
use App\Http\Requests\UpdateWordRequest;
use Illuminate\Http\Request;

interface WordRepositoryInterface {

          public function index();

          // public function create();
      
          // public function edit($id);
          
          public function show($id);
      
          public function store($request);

          public function storeMultiple($request);
      
          public function update($request , $id);
      
          public function destroy($id);
}