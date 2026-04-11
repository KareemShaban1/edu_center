<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\CertificationTemplate;
use Illuminate\Http\Request;
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf as PDF;

class CertificationTemplateController extends Controller
{
    public function index()
    {
        $templates = CertificationTemplate::all();
        return view('dashboards.admin.certificationTemplate.index', compact('templates'));
    }

    public function create()
    {
        return view('dashboards.admin.certificationTemplate.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required',
            'content' => 'required',
        ]);

        $variables = $this->extractPlaceholders($request->content);

        $certification = CertificationTemplate::create([
            'title' => $request->title,
            'content' => $request->content,
            'variables' => $variables,
        ]);

        if ($request->hasFile('background_image')) {
            $certification->addMediaFromRequest('background_image')
                ->toMediaCollection('certification_background');
        }

        return redirect()->route('certifications.index')->with('success', 'Template created.');
    }

    public function edit(CertificationTemplate $certification)
    {
        return view('dashboards.admin.certificationTemplate.edit', compact('certification'));
    }

    public function update(Request $request, CertificationTemplate $certification)
    {
        $request->validate([
            'name' => 'required',
            'content' => 'required',
        ]);

        $certification->update($request->only('name', 'content'));

        return redirect()->route('certifications.index')->with('success', 'Template updated.');
    }

    public function show(CertificationTemplate $certification)
    {
        // simulate data
        $data = [
            'student_name' => 'Ahmed Ali',
            'course_name' => 'Web Development',
            'completion_date' => now()->format('Y-m-d'),
        ];

        $html = $this->renderTemplate($certification->content, $data);

        return view('dashboards.admin.certificationTemplate.show', compact('html', 'certification'));
    }

    private function renderTemplate($template, $variables)
    {
        foreach ($variables as $key => $value) {
            $template = str_replace('{{ ' . $key . ' }}', $value, $template);
        }

        return $template;
    }

    private function extractPlaceholders($content)
    {
        preg_match_all('/{{\s*(\w+)\s*}}/', $content, $matches);
        return $matches[1]; // just the variable names
    }

    public function generatePdf(Request $request, $id)
    {
        $certification = CertificationTemplate::findOrFail($id);
        $htmlContent = $request->input('final_content');
        $backgroundUrl = $request->input('selected_background');
    
        return view('dashboards.admin.certificationTemplate.pdf_preview', [
            'htmlContent' => $htmlContent,
            'backgroundUrl' => $backgroundUrl
        ]);
    }
}
