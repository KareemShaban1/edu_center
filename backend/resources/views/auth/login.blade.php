<!DOCTYPE html>
<html lang="en" dir="rtl">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="keywords" content="HTML5 Template" />
    <meta name="description" content="Webmin - Bootstrap 4 & Angular 5 Admin Dashboard Template" />
    <meta name="author" content="potenzaglobalsolutions.com" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title> سيستم لإدارة السناتر الدراسية </title>

    <!-- Favicon -->
    <link rel="shortcut icon" href="images/favicon.ico" />

    <!-- Font -->
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Poppins:200,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900">

    <!-- css -->
    <link href="{{ URL::asset('assets/css/rtl.css') }}" rel="stylesheet">

</head>

<body>

    <div class="wrapper">
        <!--=================================
preloader -->

        <div id="pre-loader">
            <img src="{{ URL::asset('assets/images/pre-loader/loader-02.svg') }}" alt="">
        </div>

        <!--=================================
preloader -->

        <!--=================================
login-->

        <section class="height-100vh d-flex align-items-center page-section-ptb login" {{-- style="background-image: url('{{ asset('assets/images/sativa.png')}}');" --}}
            style="background-color: gainsboro">
            <div class="container">
                <div class="row justify-content-center no-gutters vertical-align">
                    
                    <div class="col-lg-4 col-md-6 bg-white">
                        <div class="login-fancy pb-40 clearfix">
                            @if ($type == 'student')
                                <h3 style="font-family: 'Cairo', sans-serif" class="mb-30">تسجيل دخول طالب</h3>
                            @elseif($type == 'parent')
                                <h3 style="font-family: 'Cairo', sans-serif" class="mb-30">تسجيل دخول ولي امر</h3>
                            @elseif($type == 'teacher')
                                <h3 style="font-family: 'Cairo', sans-serif" class="mb-30">تسجيل دخول معلم</h3>
                            @else
                                <h3 style="font-family: 'Cairo', sans-serif" class="mb-30">تسجيل دخول ادمن</h3>
                            @endif

                            @if (\Session::has('message'))
                                <div class="alert alert-danger">
                                    <li>{!! \Session::get('message') !!}</li>
                                </div>
                            @endif


                            <form method="POST" action="{{ route('login') }}">
                                @csrf

                                <div class="section-field mb-20">
                                    <label for="email" class="mb-10" for="name">البريدالالكتروني*</label>
                                    <input id="email" type="email"
                                        class="form-control @error('email') is-invalid @enderror" name="email"
                                        required autocomplete="email" autofocus>
                                    <input type="hidden" value="{{ $type }}" name="type">
                                    @error('email')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror

                                </div>

                                <div class="section-field mb-20">
                                    <label class="mb-10" for="password">كلمة المرور * </label>
                                    <input id="password" type="password"
                                        class="form-control @error('password') is-invalid @enderror" name="password"
                                        required autocomplete="current-password">

                                    @error('password')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror

                                </div>
                                
                                <button class="btn btn-dark"><span>{{ trans('Auth/selection_trans.LogIn') }}</span><i class="fa fa-check"></i></button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="col-lg-4 col-md-6 login-fancy-bg bg" {{-- style="background-color: black" --}}
                        style="background-image: url('{{ asset('assets/images/img1.jpg') }}');">
                        {{-- <div class="login-fancy"> --}}
                        {{-- <h2 class="text-white mb-20">Kari Soft</h2> --}}
                        {{-- <p class="mb-20 text-white">Create tailor-cut websites with the exclusive multi-purpose
                            responsive template along with powerful features.</p>
                        <ul class="list-unstyled  pos-bot pb-30">
                            <li class="list-inline-item"><a class="text-white" href="#"> Terms of Use</a> </li>
                            <li class="list-inline-item"><a class="text-white" href="#"> Privacy Policy</a></li>
                        </ul> --}}
                        {{-- </div> --}}
                    </div>
                    
                    
                </div>
            </div>
        </section>

        <!--=================================
login-->

    </div>
    <!-- jquery -->
    <script src="{{ URL::asset('assets/js/jquery-3.3.1.min.js') }}"></script>
    <!-- plugins-jquery -->
    <script src="{{ URL::asset('assets/js/plugins-jquery.js') }}"></script>
    <!-- plugin_path -->
    <script>
        var plugin_path = 'js/';
    </script>

    @yield('js')
    <!-- validation -->
    <script src="{{ URL::asset('assets/js/validation.js') }}"></script>
    <!-- custom -->
    <script src="{{ URL::asset('assets/js/custom.js') }}"></script>

</body>

</html>
