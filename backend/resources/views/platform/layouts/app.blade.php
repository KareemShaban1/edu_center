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



        <div id="pre-loader">
            <img src="{{ URL::asset('assets/images/pre-loader/loader-02.svg') }}" alt="">
        </div>



        @include('platform.layouts.main-platform-header')
        @include('layouts.main-sidebar.platform-main-sidebar')


        <div class="content-wrapper" style="background-color:rgb(255, 255, 255); width: 85%;">



            <div class="page-title">
                @yield('page-header')
            </div>

            @yield('content')


  
            @include('layouts.footer')
        </div>
    


        </div>

    @include('layouts.footer-scripts')



</body>

</html>