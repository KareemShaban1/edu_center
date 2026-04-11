<?php 

namespace App\Repository\Admin;

use App\Http\Requests\StoreSectionRequest;
use Illuminate\Http\Request;

interface SectionRepositoryInterface {

          public function index();

          public function details($id);

          // public function create();
      
          // public function edit($id);
      
          public function store(StoreSectionRequest $request);
      
          public function update(StoreSectionRequest $request);
      
          public function destroy(Request $request);

          public function notes($id);

          public function getclasses($id);

          public function getsections($id);


}
