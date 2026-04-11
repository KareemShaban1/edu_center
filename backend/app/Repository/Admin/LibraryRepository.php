<?php

namespace App\Repository\Admin;

use App\Http\Traits\AttachFilesTrait;
use App\Models\Grade;
use App\Models\Library;
use ZipArchive;

class LibraryRepository implements LibraryRepositoryInterface
{

    use AttachFilesTrait;

    public function index()
    {
        $books = Library::all();
        return view('dashboards.admin.library.index', compact('books'));
    }

    public function create()
    {
        $grades = Grade::all();
        return view('dashboards.admin.library.create', compact('grades'));
    }

    public function store($request)
    {
        try {
            $books = new Library();
            $books->title = $request->title;
            $books->grade_id = $request->grade_id;
            $books->class_id = $request->class_id;
            $books->section_id = $request->section_id;
            $books->save();

            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $books->addMedia($file)
                        ->toMediaCollection('library');
                }
            }

            return redirect()->route('library.index');
        } catch (\Exception $e) {
            // dd($e->getMessage());
            return redirect()->back()->with(['error' => $e->getMessage()]);
        }
    }


    public function edit($id)
    {
        $grades = Grade::all();
        $book = library::findorFail($id);
        return view('dashboards.admin.library.edit', compact('book', 'grades'));
    }

    public function show($id)
    {
        $book = library::findorFail($id);
        return view('dashboards.admin.library.show', compact('book'));
    }

    public function update($request)
    {
        try {

            $book = library::findOrFail($request->id);
            $book->title = $request->title;
            $book->grade_id = $request->grade_id;
            $book->class_id = $request->class_id;
            $book->section_id = $request->section_id;
            $book->save();

            if ($request->hasFile('files')) {
                $book->clearMediaCollection('library');
                foreach ($request->file('files') as $file) {
                    $book->addMedia($file)
                        ->toMediaCollection('library');
                }
            }

            return redirect()->route('library.index');
        } catch (\Exception $e) {
            dd($e->getMessage());
            return redirect()->back()->with(['error' => $e->getMessage()]);
        }
    }

    public function destroy($request)
    {
        $book = Library::findOrFail($request->id);
        $book->clearMediaCollection('library');
        $book->delete();
        return redirect()->route('library.index');
    }


    public function download($bookId)
    {
        $book = library::findOrFail($bookId);
        $mediaItems = $book->getMedia('library');

        if ($mediaItems->isEmpty()) {
            return redirect()->back()->with('error', 'No attachments found.');
        }

        $zipFileName = 'attachments_' . $book->id . '.zip';
        $zipPath = storage_path('app/public/temp/' . $zipFileName);

        // Ensure temp directory exists
        if (!file_exists(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($mediaItems as $media) {
                $filePath = $media->getPath();
                $fileName = $media->file_name;
                $zip->addFile($filePath, $fileName);
            }
            $zip->close();
        } else {
            return redirect()->back()->with('error', 'Unable to create ZIP file.');
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
}
