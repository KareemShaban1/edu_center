<?php

namespace App\View\Components;

use Illuminate\View\Component;

class NotificationsMenu extends Component
{
    public $notifications;
    public $newCount;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {
        $user = auth()->user();
        if ($user) {
            $this->notifications = $user->notifications ?? collect();
            $this->newCount = $user->unreadNotifications?->count();
        } else {
            $this->notifications = collect();
            $this->newCount = 0;
        }
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.notifications-menu');
    }
}
