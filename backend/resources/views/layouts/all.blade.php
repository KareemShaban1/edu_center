<!DOCTYPE html>
{{-- get app language --}}
<html lang="{{ App::currentLocale() }}" dir="{{ App::isLocale('ar') ? 'rtl' : 'ltr' }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="keywords" content="Laravel Teacher Center Management System" />
    <meta name="description" content="Teacher Center Management System" />
    <meta name="author" content="kareem shaban" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

    <!-- Title -->
    <title>@yield('title')</title>

    <!-- Favicon -->
    <link rel="shortcut icon" href="{{ URL::asset('assets/images/favicon.ico') }}" type="image/x-icon" />

    <!-- Font -->

    {{-- Icons --}}
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css" rel="stylesheet">


    <link href="{{ URL::asset('css/wizard.css') }}" rel="stylesheet" id="bootstrap-css">


    @yield('css')
    <!--- Style css -->
    @if (App::getLocale() == 'en')
        <link href="{{ URL::asset('assets/css/ltr.css') }}" rel="stylesheet">
    @else
        <link href="{{ URL::asset('assets/css/rtl.css') }}" rel="stylesheet">
    @endif

    <!--- Style css -->


    <link href="{{ URL::asset('assets/css/style.css') }}" rel="stylesheet">


</head>

<body>

    <div class="wrapper" style="font-family: 'Cairo', sans-serif">



        <div id="pre-loader">
            <img src="{{ URL::asset('assets/images/pre-loader/loader-01.svg') }}" alt="">
        </div>

        <!--================================= header start-->
        <nav class="admin-header navbar navbar-default col-lg-12 col-12 p-0 fixed-top d-flex flex-row">


            <!-- logo -->
            <div class="text-left navbar-brand-wrapper">
                {{-- <a class="navbar-brand brand-logo" href="{{ url('/dashboard') }}"><img src="{{ URL::asset('assets/images/logo-dark.png') }}" alt=""></a>
              <a class="navbar-brand brand-logo-mini" href="{{ url('/dashboard') }}"><img src="{{ URL::asset('assets/images/logo-icon-dark.png') }}"
                      alt=""></a> --}}
            </div>


            <!-- Top bar right -->
            <ul class="nav navbar-nav mr-auto">
                <li class="nav-item">
                    <a id="button-toggle" class="button-toggle-nav inline-block ml-20 pull-left"
                        href="javascript:void(0);"><i class="zmdi zmdi-menu ti-align-right"></i></a>
                </li>
                <li class="nav-item">
                    <div class="search">
                        <a class="search-btn not_click" href="javascript:void(0);"></a>
                        <div class="search-box not-click">
                            <input type="text" class="not-click form-control" placeholder="Search" value=""
                                name="search">
                            <button class="search-button" type="submit"> <i
                                    class="fa fa-search not-click"></i></button>
                        </div>
                    </div>
                </li>
            </ul>


            <!-- top bar left -->
            <ul class="nav navbar-nav ml-auto">

                {{-- switch languages buttons --}}
                <div class="btn-group mb-1">
                    <button type="button" class="btn btn-light btn-sm dropdown-toggle" data-toggle="dropdown"
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


                <li class="nav-item dropdown ">
                    <a class="nav-link top-nav" data-toggle="dropdown" href="#" role="button"
                        aria-haspopup="true" aria-expanded="false">
                        <i class="ti-bell"></i>
                        <span class="badge badge-danger notification-status"> </span>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right dropdown-big dropdown-notifications">
                        <div class="dropdown-header notifications">
                            <strong>{{ trans('Sidebar_trans.Notifications') }}</strong>
                            <span class="badge badge-pill badge-warning">05</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item">New registered user <small
                                class="float-right text-muted time">Just now</small> </a>
                        <a href="#" class="dropdown-item">New invoice received <small
                                class="float-right text-muted time">22 mins</small> </a>
                        <a href="#" class="dropdown-item">Server error report<small
                                class="float-right text-muted time">7 hrs</small> </a>
                        <a href="#" class="dropdown-item">Database report<small
                                class="float-right text-muted time">1
                                days</small> </a>
                        <a href="#" class="dropdown-item">Order confirmation<small
                                class="float-right text-muted time">2
                                days</small> </a>
                    </div>
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
                        <a class="dropdown-item" href="#"><i class="text-info ti-settings"></i>Settings</a>

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
        </nav>

        <!--================================= header End-->
        <div class="container-fluid">
            <div class="row">
                <div class="side-menu-fixed">

                    <div class="scrollbar side-menu-bg" style="overflow: scroll">
                        <ul class="nav navbar-nav side-menu" id="sidebarnav">
                            <!-- menu item Dashboard-->
                            <li>
                                <a href="{{ url('/dashboard') }}">
                                    <div class="pull-left"><i class="ti-home"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Dashboard') }}</span>
                                    </div>
                                    <div class="clearfix"></div>
                                </a>
                            </li>

                            <!-- Grades-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#Grades-menu">
                                    <div class="pull-left"><i class="fas fa-school"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Grades') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Grades-menu" class="collapse" data-parent="#sidebarnav">
                                    <li><a
                                            href="{{ route('Grades.index') }}">{{ trans('main_trans.Grades_list') }}</a>
                                    </li>

                                </ul>
                            </li>
                            <!-- classes-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#classes-menu">
                                    <div class="pull-left"><i class="fa fa-building"></i><span
                                            class="right-nav-text">{{ trans('main_trans.classes') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="classes-menu" class="collapse" data-parent="#sidebarnav">
                                    <li><a
                                            href="{{ route('Classes.index') }}">{{ trans('main_trans.List_classes') }}</a>
                                    </li>
                                </ul>
                            </li>


                            <!-- sections-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#sections-menu">
                                    <div class="pull-left"><i class="fas fa-chalkboard"></i></i><span
                                            class="right-nav-text">{{ trans('main_trans.sections') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="sections-menu" class="collapse" data-parent="#sidebarnav">
                                    <li><a
                                            href="{{ route('sections.index') }}">{{ trans('main_trans.List_sections') }}</a>
                                    </li>
                                </ul>
                            </li>


                            <!-- Teachers-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#Teachers-menu">
                                    <div class="pull-left"><i class="fas fa-chalkboard-teacher"></i></i><span
                                            class="right-nav-text">{{ trans('main_trans.Teachers') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Teachers-menu" class="collapse" data-parent="#sidebarnav">
                                    <li> <a
                                            href="{{ route('Teachers.index') }}">{{ trans('main_trans.List_Teachers') }}</a>
                                    </li>
                                </ul>
                            </li>

                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#students-menu">
                                    <div class="pull-left"><i class="fas fa-user-graduate"
                                            aria-hidden="true"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Students') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="students-menu" class="collapse" data-parent="#sidebarnav">
                                    <li> <a
                                            href="{{ route('students.create') }}">{{ trans('main_trans.add_student') }}</a>
                                    </li>
                                    <li> <a
                                            href="{{ route('students.index') }}">{{ trans('main_trans.list_students') }}</a>
                                    </li>
                                </ul>
                            </li>


                            <!-- Parents-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#Parents-menu">
                                    <div class="pull-left"><i class="fas fa-user-tie"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Parents') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Parents-menu" class="collapse" data-parent="#sidebarnav">
                                    <li> <a href="{{ url('add_parent') }}">{{ trans('main_trans.List_Parents') }}</a>
                                    </li>
                                </ul>
                            </li>

                            <!-- Attendance-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#Attendance-icon">
                                    <div class="pull-left"><i class="fas fa-calendar-alt"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Attendance') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Attendance-icon" class="collapse" data-parent="#sidebarnav">
                                    <li> <a
                                            href="{{ route('attendance.show_groups') }}">{{ trans('main_trans.Show_Group') }}</a>
                                    </li>
                                </ul>
                            </li>

                            {{-- Exams --}}
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#Exams-icon">
                                    <div class="pull-left"><i class="fas fa-book-open"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Exam_Quiz') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Exams-icon" class="collapse" data-parent="#sidebarnav">
                                    <li> <a href="{{ Route('Exam.index') }}">{{ trans('main_trans.Exam') }}</a> </li>
                                    <li> <a href="{{ Route('Quiz.index') }}">{{ trans('main_trans.Quiz') }}</a> </li>
                                </ul>
                            </li>



                            <!-- Payment-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#Payment-menu">
                                    <div class="pull-left"><i class="fas fa-money-bill-wave-alt"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Accounts') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Payment-menu" class="collapse" data-parent="#sidebarnav">
                                    <li> <a href="{{ route('Fees.index') }}">{{ trans('main_trans.Fees') }}</a> </li>
                                    <li> <a href="{{ route('Payment.index') }}">
                                            {{ trans('main_trans.Payment') }}</a> </li>

                                </ul>
                            </li>



                            <!-- Announcements-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse"
                                    data-target="#Announcements-menu">
                                    <div class="pull-left"><i class="fas fa-bell"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Announcements') }}</span>
                                    </div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Announcements-menu" class="collapse" data-parent="#sidebarnav">
                                    <li> <a
                                            href="{{ route('announcement.index') }}">{{ trans('main_trans.Announcements') }}</a>
                                    </li>
                                    <li> <a href="{{ route('announcement.add') }}">
                                            {{ trans('main_trans.Add_Announcement') }}</a> </li>

                                </ul>
                            </li>





                            <!-- books-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse" data-target="#library-icon">
                                    <div class="pull-left"><i class="fas fa-book"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Books') }}</span></div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="library-icon" class="collapse" data-parent="#sidebarnav">
                                    <li> <a
                                            href="{{ route('library.index') }}">{{ trans('main_trans.Books_List') }}</a>
                                    </li>
                                </ul>
                            </li>


                            <!-- Online classes-->
                            <li>
                                <a href="javascript:void(0);" data-toggle="collapse"
                                    data-target="#Onlineclasses-icon">
                                    <div class="pull-left"><i class="fas fa-video"></i><span
                                            class="right-nav-text">{{ trans('main_trans.Onlineclasses') }}</span>
                                    </div>
                                    <div class="pull-right"><i class="ti-plus"></i></div>
                                    <div class="clearfix"></div>
                                </a>
                                <ul id="Onlineclasses-icon" class="collapse" data-parent="#sidebarnav">
                                    <li> <a
                                            href="{{ route('meetings.index') }}">{{ trans('main_trans.Online_Classes') }}</a>
                                    </li>
                                </ul>
                            </li>

                            <!-- Settings-->
                            <li>
                                <a href="{{ route('settings.index') }}"><i class="fas fa-cogs"></i><span
                                        class="right-nav-text">{{ trans('main_trans.Settings') }} </span></a>
                            </li>

                        </ul>
                    </div>


                </div>


                <div class="content-wrapper">

                    <div class="page-title">
                        @yield('page-header')
                    </div>

                    @yield('content')



                    @include('layouts.footer')
                </div>

            </div>
        </div>
    </div>

    <!--=================================
 footer -->

    @include('layouts.footer-scripts')

</body>

</html>
