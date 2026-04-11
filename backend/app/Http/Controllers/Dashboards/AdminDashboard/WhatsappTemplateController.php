<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\WhatsappTemplate;
use Illuminate\Http\Request;

class WhatsappTemplateController extends Controller
{
    //
    public function listJson()
    {
        return response()->json(WhatsAppTemplate::all());
    }
    public function index(Request $request)
    {
        $templates = WhatsappTemplate::all();
        if($request->ajax()){

            return response()->json(['data' => $templates]);

        }
        return view('dashboards.admin.whatsappTemplate.index', compact('templates'));
    }

    public function show($id){
        $template = WhatsappTemplate::find($id);

        return response()->json(['data' => $template]);

    }

    public function store(Request $request)
    {
        try{
            $request->validate([
                'name' => 'required',
                'content' => 'required',
            ]);
    
            $variables = $this->extractPlaceholders($request->content);
    

            WhatsAppTemplate::create([
                'name' => $request->name,
                'content' => $request->content,
                'variables' => $variables,
            ]);
    
            return redirect()->back()->with('success', 'Template created.');
        }
    catch (\Exception $e) {
        dd($e->getMessage());
        return redirect()->back()->withInput()->withErrors(['error' => $e->getMessage()]);
    }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required',
            'content' => 'required',
        ]);

        $template = WhatsAppTemplate::findOrFail($id);

        $variables = $this->extractPlaceholders($request->content);

        $template->update([
            'name' => $request->name,
            'content' => $request->content,
            'variables' => $variables,
        ]);

        return redirect()->back()->with('success', 'Template updated.');
    }

    private function extractPlaceholders($content)
    {
        preg_match_all('/{{\s*(\w+)\s*}}/', $content, $matches);
        return $matches[1]; // just the variable names
    }
}
