@forelse ($announcements as $announcement)
    <div class="col-xl-3 col-lg-6 col-md-6 mb-4">
        <div class="card shadow h-100">
            <div class="card-body">
                <div class="text-center mb-2">
                    <div class="p-2 rounded 
                        {{ $announcement->announcement_type == 'quiz' ? 'bg-success' : 'bg-danger' }}">
                        <h5 class="card-title text-white mb-0">{{ $announcement->title }}</h5>
                    </div>
                </div>
                <div class="p-2">
                    <p>
                        <span class="text-warning font-weight-bold">
                            {{ trans('Student_Dashboard/student_trans.Announcement_Body') }} :
                        </span>
                        <br>{{ $announcement->body }}
                    </p>
                </div>
                <div class="border-top pt-2 text-center">
                    <p>
                        {{ trans('Student_Dashboard/student_trans.Announcement_Date') }}: 
                        <span class="text-success">{{ $announcement->time }}</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
@empty
    <div class="col-12">
        <div class="alert alert-info text-center">
            {{ __('No Announcements Found') }}
        </div>
    </div>
@endforelse
