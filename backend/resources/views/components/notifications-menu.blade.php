<li class="dropdown">
    <a class="nav-link top-nav" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">
        <i class="ti-bell"></i>
        @if ($newCount)
        <span class="badge badge-danger notification-status nm-count">{{ $newCount }}</span>
        @endif
    </a>
    <div class="dropdown-menu dropdown-menu-right dropdown-big dropdown-notifications">
        <div class="dropdown-header notifications">
            <strong>{{ trans('admin/dashboard_trans.Notifications') }}</strong>
            <span class="badge badge-pill badge-warning nm-count">{{ $newCount }}</span>
        </div>
        <div class="dropdown-divider"></div>

        <div class="notifications-scroll">

        <ul id="nm-list" class="list-unstyled mb-0">
            @foreach ($notifications->take(10) as $notification)
            <li data-id="{{ $notification->id }}">
                <a href="#" class="dropdown-item notification-item @if($notification->unread()) text-danger @endif">
                    {{ $notification->data['title'] }}
                    <br>
                    {{ $notification->data['body'] ?? 'No message available' }}
                    <small class="float-right text-muted time">{{ $notification->created_at->diffForHumans() }}</small>
                </a>
            </li>
            @endforeach
        </ul>
        </div>

        <div class="d-flex justify-center gap-5">

        @if ($notifications->count() > 10)
        <div>
            <button class="btn btn-sm btn-primary" id="load-more-notifications">{{ __('Load More') }}</button>
        </div>
        @endif

        <div>
            <button class="btn btn-sm btn-secondary" id="mark-all-read">{{ __('Mark All as Read') }}</button>
        </div>
        </div>
      

    </div>
</li>