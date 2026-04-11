<?php

namespace App\Http\Livewire;

use Livewire\Component;

class Payment extends Component

{

    public $successMessage = '';

    public $catchError,$updateMode = false,$photos,$show_table = true,$Parent_id;

    public $currentStep = 1;

    public function render()
    {
        return view('dashboards.admin.livewire.payment');
    }
}
