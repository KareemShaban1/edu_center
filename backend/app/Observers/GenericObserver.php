<?php

namespace App\Observers;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class GenericObserver
{
    public function handle($model, $action)
    {
        ActivityLog::create([
            'action' => $action,
            'model' => get_class($model),
            'model_id' => $model->id,
            'changes' => $action === 'updated' ? json_encode($model->getChanges()) : null,
            'user_id' => Auth::id(),
        ]);
    }

    public function created($model) { $this->handle($model, 'created'); }
    public function updated($model) { $this->handle($model, 'updated'); }
    public function deleted($model) { $this->handle($model, 'deleted'); }
}
