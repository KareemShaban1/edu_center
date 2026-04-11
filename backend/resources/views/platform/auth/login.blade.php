<!DOCTYPE html>
<html lang="en" dir="rtl">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="keywords" content="HTML5 Template" />
    <meta name="description" content="Educational Center Platform Admin" />
    <meta name="author" content="potenzaglobalsolutions.com" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>منصة إدارة السناتر الدراسية</title>

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
        <div id="pre-loader">
            <img src="{{ URL::asset('assets/images/pre-loader/loader-02.svg') }}" alt="">
        </div>

        <section class="height-100vh d-flex align-items-center page-section-ptb login"
            style="background-color: gainsboro">
            <div class="container">
                <div class="row justify-content-center no-gutters vertical-align">
                    <div class="col-lg-4 col-md-6 bg-white">
                        <div class="login-fancy pb-40 clearfix">
                            <h3 style="font-family: 'Cairo', sans-serif" class="mb-30">تسجيل دخول مدير المنصة</h3>

                            @if ($errors->any())
                                <div class="alert alert-danger">
                                    <ul class="mb-0">
                                        @foreach ($errors->all() as $error)
                                            <li>{{ $error }}</li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif

                            <form action="{{ route('platform.login') }}" method="POST">
                                @csrf

                                <div class="section-field mb-20">
                                    <label class="mb-10" for="email">البريد الالكتروني*</label>
                                    <input id="email" type="email"
                                        class="form-control @error('email') is-invalid @enderror" name="email"
                                        value="{{ old('email') }}" required autocomplete="email" autofocus>
                                    @error('email')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>

                                <div class="section-field mb-20">
                                    <label class="mb-10" for="password">كلمة المرور*</label>
                                    <input id="password" type="password"
                                        class="form-control @error('password') is-invalid @enderror" name="password"
                                        required autocomplete="current-password">
                                    @error('password')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>

                                <div class="section-field mb-20">
                                    <div class="custom-control custom-checkbox">
                                        <input type="checkbox" class="custom-control-input" name="remember"
                                            id="remember">
                                        <label class="custom-control-label" for="remember">تذكرني</label>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-dark">
                                    <span>تسجيل الدخول</span>
                                    <i class="fa fa-check"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 login-fancy-bg bg"
                        style="background-image: url('{{ asset('assets/images/img1.jpg') }}');">
                    </div>
                </div>
            </div>
        </section>

    </div>
    <script src="{{ URL::asset('assets/js/jquery-3.3.1.min.js') }}"></script>
    <script src="{{ URL::asset('assets/js/plugins-jquery.js') }}"></script>
    <script>
        var plugin_path = 'js/';
    </script>

    <script src="{{ URL::asset('assets/js/validation.js') }}"></script>
    <script src="{{ URL::asset('assets/js/custom.js') }}"></script>

</body>

</html>
