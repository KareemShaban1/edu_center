<?php 

namespace App\Repository\Admin;

interface AnnouncementRepositoryInterface {

          public function index();

          public function create();

          public function store($request);

          public function edit($announcement);

          public function update($request,$id);

          public function destroy($id);

}


?>