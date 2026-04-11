<!DOCTYPE html>
<html lang="{{ App::currentLocale() }}" dir="{{ App::isLocale('ar') ? 'rtl' : 'ltr' }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="keywords" content="Teacher Center Management System" />
    <meta name="description" content="Teacher Center Management System" />
    <meta name="author" content="kareem shaban" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>@yield('title', 'منصة إدارة السناتر الدراسية')</title>
    @include('layouts.head')
</head>

<body>
    <div class="wrapper" style="font-family: 'Cairo', sans-serif">
        <!--=================================
 preloader -->
        <div id="pre-loader">
            <img src="{{ URL::asset('assets/images/pre-loader/loader-02.svg') }}" alt="">
        </div>

        <!--=================================
 preloader -->

        @include('platform.layouts.main-platform-header')
        @include('layouts.main-sidebar.platform-main-sidebar')


        <div class="content-wrapper" style="background-color:rgb(255, 255, 255)">
            <div class="page-title">
                @yield('page-header')
            </div>

            @yield('content')

            <!--================================= notification toaster -->
            <!-- <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
                <div id="notification-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto" id="notification-title"></strong>
                        <small id="notification-time"></small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body" id="notification-body"></div>
                </div>
            </div> -->

            @include('layouts.footer')
        </div>
        <!-- main content wrapper end-->
    </div>


    @include('layouts.footer-scripts')
    @stack('scripts')

</body>

</html>