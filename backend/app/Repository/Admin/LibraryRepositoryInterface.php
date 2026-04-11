<?php

namespace App\Repository\Admin;

use App\Models\Library;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

interface LibraryRepositoryInterface
{
    public function index();

    public function create();

    public function store($request);

    public function edit($id);

    public function update($request);

    public function destroy($request);

    public function download($bookId);
}
