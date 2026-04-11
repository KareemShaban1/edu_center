<?php

namespace App\Http\Controllers\Dashboards\StudentDashboard;

use App\Http\Controllers\Controller;
use App\Models\Library;
use Illuminate\Http\Request;
use ZipArchive;

class LibraryController extends Controller
{
    public function studentLibrary($student_id)
{
    if ($this->checkStudentSection($student_id)) {
        return redirect()->back();
    }

    $books = Library::where('section_id', $student_id)->latest()->get();
    return view('dashboards.student.library.student_library', compact('books', 'student_id'));
}

public function filterLibrary(Request $request, $student_id)
{
    $query = Library::where('section_id', $student_id);

    if ($request->filled('start_date')) {
        $query->whereDate('created_at', '>=', $request->start_date);
    }
    if ($request->filled('end_date')) {
        $query->whereDate('created_at', '<=', $request->end_date);
    }
    if ($request->filled('month_year')) {
        [$year, $month] = explode('-', $request->month_year);
        $query->whereYear('created_at', $year)
              ->whereMonth('created_at', $month);
    }

    $books = $query->latest()->get();

    $html = view('dashboards.student.library.partials.book_cards', compact('books'))->render();

    return response()->json(['html' => $html]);
}

public function checkStudentSection($student_id)
{
    $student = auth()->user();
    if ($student->section_id != $student_id) {
        return true;
    }
    return false;
}

public function download($bookId)
{
    dd($bookId);
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
