<?php

namespace App\Http\Controllers\Dashboards\AdminDashboard;

use App\Http\Controllers\Controller;
use App\Models\Word;
use App\Http\Requests\StoreWordRequest;
use App\Http\Requests\UpdateWordRequest;
use App\Repository\Admin\WordRepositoryInterface;
use Illuminate\Http\Request;

class WordController extends Controller
{
    protected $words;

    public function __construct(WordRepositoryInterface $words)
    {
        $this->words = $words;
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
        return $this->words->index();
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \App\Http\Requests\StoreWordRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreWordRequest $request)
    {
        //
        return $this->words->store($request);
    }

    public function storeMultiple(Request $request)
    {
        //
        return $this->words->storeMultiple($request);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Word  $word
     * @return \Illuminate\Http\Response
     */
    public function show(Word $word)
    {
        //
        return $this->words->show($word);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Word  $word
     * @return \Illuminate\Http\Response
     */
    public function edit(Word $word)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \App\Http\Requests\UpdateWordRequest  $request
     * @param  \App\Models\Word  $word
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateWordRequest $request, $id)
    {
        //
        return $this->words->update($request, $id);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Word  $word
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
        return $this->words->destroy($id);
    }
}
