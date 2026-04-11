<!DOCTYPE html>
<html lang="{{ App::currentLocale() }}" dir="{{ App::isLocale('ar') ? 'rtl' : 'ltr' }}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="keywords" content="Teacher Center Management System" />
    <meta name="description" content="Teacher Center Management System" />
    <meta name="author" content="kareem shaban" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
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

        @include('layouts.main-header')
        @include('layouts.main-sidebar')

        <!--=================================
 Main content -->
        <!-- main-content -->
        <div class="content-wrapper" style="background-color:rgb(255, 255, 255)">



            <div class="page-title">
                @yield('page-header')
            </div>

            @yield('content')


            <!--================================= notification toaster -->
             <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
                <div id="notification-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto" id="notification-title"></strong>
                        <small id="notification-time"></small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>

                    <div class="toast-body" id="notification-body">
                    </div>
                </div>
            </div> 

            {{-- <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
                <div id="notification-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="mr-auto" id="notification-title">Bootstrap</strong>
                        <small>11 mins ago</small>
                        <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div class="toast-body">
                        Hello, world! This is a toast message.
                    </div>
                </div>
            </div> --}}
            {{-- <div class="toast" data-autohide="true">
                <div class="toast-header">
                    <strong class="mr-auto text-primary">Toast Header</strong>
                    <small class="text-muted">5 mins ago</small>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast">&times;</button>
                </div>
                <div class="toast-body">
                    Some text inside the toast body
                </div>
            </div> --}}



            @include('layouts.footer')
        </div><!-- main content wrapper end-->
    </div>
    </div>
    </div>

    <!--=================================
 footer -->

    @include('layouts.footer-scripts')

</body>

</html>
