<nav class="admin-header navbar navbar-default col-lg-12 col-12 p-0 fixed-top d-flex flex-row">


    <div class="navbar-brand-wrapper w-[230px] !important text-center">
        <a class="text-gray font-weight-bold text-2xl">
            <span>Admins Managment</span>
        </a>
    </div>


    <div class="d-flex justify-content-between middle-nav">
        <!-- Top bar right -->
        <ul class="nav navbar-nav">
            <li class="nav-item">
                <a id="button-toggle" class="button-toggle-nav inline-block ml-20 pull-left" href="javascript:void(0);"><i
                        class="zmdi zmdi-menu ti-align-right"></i></a>
            </li>

        </ul>


        <!-- top bar left -->
        <ul class="nav navbar-nav left-nav">

            <li class="nav-item dropdown">
                <a class="nav-link nav-pill user-avatar" data-toggle="dropdown" href="#" role="button"
                    aria-haspopup="true" aria-expanded="false">
                    <i class="ti-announcement"></i>

                </a>
                <div class="dropdown-menu dropdown-menu-right" style="width: 400px;">
                    <div style="height: 400px;" class=" col-lg-12 col-md-12 col-sm-12 col-12 p-2">

                        <div class="card card-statistics h-100">

                            <div class="col-12  p-0 main-box">
                                <div class="col-12 px-0">
                                    <div class="col-12 px-3 py-3">
                                        {{ trans('admin/dashboard_trans.Fast_Processes') }}
                                    </div>
                                    <div class="col-12 " style="min-height: 1px;background: #f1f1f1;"></div>
                                </div>
                                <div class="col-12 p-3 row d-flex">
                                    <div class="col-4  d-flex justify-content-center align-items-center mb-3 py-2">
                                        <a href="{{ route('students.index') }}" target="_blank" style="color:inherit;">
                                            <div class="col-12 p-0 text-center">
                                                <img src="{{ asset('images/icons/student.png') }}"
                                                    style="width:30px;height: 30px">
                                                {{-- <span class="fal fa-home font-5" ></span> --}}
                                                <div class="col-12 p-0 text-center">
                                                    {{ trans('admin/dashboard_trans.Students') }}
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                                        <a href="{{ route('parents.index') }}" style="color:inherit;">
                                            <div class="col-12 p-0 text-center">

                                                <img src="/images/icons/parents.png" style="width:30px;height: 30px">
                                                {{-- <span class="fal fa-bells font-5" ></span> --}}
                                                <div class="col-12 p-0 text-center">
                                                    {{ trans('admin/dashboard_trans.Parents') }}
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                                        <a href="{{ route('attendance.show_groups') }}" style="color:inherit;">
                                            <div class="col-12 p-0 text-center">

                                                <img src="/images/icons/attendance.png" style="width:30px;height: 30px">
                                                {{-- <span class="fal fa-bullhorn font-5" ></span> --}}
                                                <div class="col-12 p-0 text-center">
                                                    {{ trans('admin/dashboard_trans.Attendance') }}
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                                        <a href="{{ route('QuizDegree.showGroups') }}" style="color:inherit;">
                                            <div class="col-12 p-0 text-center">
                                                <img src="/images/icons/quiz.png" style="width:30px;height: 30px">
                                                {{-- <span class="fal fa-wrench font-5" ></span> --}}
                                                <div class="col-12 p-0 text-center">
                                                    {{ trans('admin/dashboard_trans.Quizzes') }}
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                                        <a href="{{ route('ExamDegree.showGroups') }}" style="color:inherit;">
                                            <div class="col-12 p-0 text-center">
                                                <img src="/images/icons/exam.png" style="width:30px;height: 30px">
                                                {{-- <span class="fal fa-user font-5" ></span> --}}
                                                <div class="col-12 p-0 text-center">
                                                    {{ trans('admin/dashboard_trans.Exams') }}
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                                        <a href="{{ route('announcements.index') }}" style="color:inherit;">
                                            <div class="col-12 p-0 text-center">
                                                <img src="/images/icons/announcement.png"
                                                    style="width:30px;height: 30px">
                                                {{-- <span class="fal fa-user-edit font-5" ></span> --}}
                                                <div class="col-12 p-0 text-center">
                                                    {{ trans('admin/dashboard_trans.Announcements') }}
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                                        <a href="{{ route('Payment.showGroups') }}" style="color:inherit;">
                                            <div class="col-12 p-0 text-center">

                                                <img src="/images/icons/fees.png" style="width:30px;height: 30px">
                                                {{-- <span class="fal fa-sign-out-alt font-5" ></span> --}}
                                                <div class="col-12 p-0 text-center">
                                                    {{ trans('admin/dashboard_trans.Fees') }}
                                                </div>
                                            </div>
                                        </a>
                                    </div>







                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </li>


            {{-- <x-notifications-menu /> --}}

            {{-- switch languages buttons --}}
            <div class="btn-group mb-1">
                <button type="button" class="btn btn-light btn-sm dropdown-toggle lang-btn" data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">
                    @if (App::getLocale() == 'ar')
                        {{ LaravelLocalization::getCurrentLocaleName() }}
                        <img src="{{ URL::asset('assets/images/flags/EG.png') }}" alt="">
                    @else
                        {{ LaravelLocalization::getCurrentLocaleName() }}
                        <img src="{{ URL::asset('assets/images/flags/US.png') }}" alt="">
                    @endif
                </button>
                <div class="dropdown-menu">
                    @foreach (LaravelLocalization::getSupportedLocales() as $localeCode => $properties)
                        <a class="dropdown-item" rel="alternate" hreflang="{{ $localeCode }}"
                            href="{{ LaravelLocalization::getLocalizedURL($localeCode, null, [], true) }}">
                            {{ $properties['native'] }}
                        </a>
                    @endforeach
                </div>
            </div>

            {{-- full screen button --}}
            <li class="nav-item fullscreen">
                <a id="btnFullscreen" href="#" class="nav-link"><i class="ti-fullscreen"></i></a>
            </li>





            <li class="nav-item dropdown mr-30">
                <a class="nav-link nav-pill user-avatar" data-toggle="dropdown" href="#" role="button"
                    aria-haspopup="true" aria-expanded="false">
                    <img src="{{ URL::asset('assets/images/user_icon.png') }}" alt="avatar">

                </a>
                <div class="dropdown-menu dropdown-menu-right">
                    <div class="dropdown-header">
                        <div class="media">
                            <div class="media-body">
                                <h5 class="mt-0 mb-0">{{ Auth::user()->name }}</h5>
                                <span>{{ Auth::user()->email }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="dropdown-divider"></div>
                    {{-- <a class="dropdown-item" href="#"><i class="text-info ti-settings"></i>Settings</a> --}}

                    @if (auth('student')->check())
                        <form method="GET" action="{{ route('logout', 'student') }}">
                        @elseif(auth('teacher')->check())
                            <form method="GET" action="{{ route('logout', 'teacher') }}">
                            @elseif(auth('parent')->check())
                                <form method="GET" action="{{ route('logout', 'parent') }}">
                                @else
                                    <form method="GET" action="{{ route('logout', 'web') }}">
                    @endif

                    @csrf
                    <a class="dropdown-item" href="#"
                        onclick="event.preventDefault();this.closest('form').submit();"><i
                            class="bx bx-log-out"></i>تسجيل
                        الخروج</a>
                    </form>

                </div>
            </li>

        </ul>
    </div>
</nav>

