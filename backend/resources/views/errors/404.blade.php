<!DOCTYPE html>
<html lang="{{ App::currentLocale() }}" dir="{{ App::isLocale('ar') ? 'rtl' : 'ltr' }}">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - {{ trans('main_trans.404_Error') }}</title>

    <!-- favicon -->
    <link rel="shortcut icon" href="{{ asset('frontend/favicon.svg') }}" type="image/svg+xml">

    <!-- custom css link -->
    <link rel="stylesheet" href="{{ asset('frontend/assets/css/bootstrap.min.css') }}">
    <link rel="stylesheet" href="{{ asset('frontend/assets/css/rtl_style.css') }}">

    <!-- google font link -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700;800&family=Poppins:wght@400;500&display=swap"
        rel="stylesheet">
</head>

<body id="top">
    <!-- HEADER -->
    <header class="header" data-header>
        <div class="container">
            <a href="#" class="logo" style="text-decoration: none;">
                <h3 style="direction:ltr; display: flex; font-size:25px; font-weight:bold">
                    <span style="color: var(--kappel); margin-right:10px">Kari</span> eduCenter
                </h3>
            </a>
        </div>
    </header>

    <main>
        <article>
            <!-- 404 SECTION -->
            <section class="section hero has-bg-image" aria-label="404"
                style="background-image: url('{{ asset('frontend/assets/images/hero-bg.svg') }}'); min-height: 100vh; display: flex; align-items: center;">
                <div class="container">
                    <div class="hero-content text-center">
                        <h1 class="h1 section-title" style="font-size: 8rem; color: var(--kappel);">404</h1>
                        <h2 class="hero-text" style="font-size: 2rem; margin: 2rem 0;">
                            {{ trans('main_trans.Page_Not_Found') }}
                        </h2>
                        <p class="section-text" style="margin-bottom: 2rem;">
                            {{ trans('main_trans.404_Message') }}
                        </p>
                        <a href="{{ url('/') }}" class="btn has-before">
                            <span class="span">{{ trans('main_trans.Back_To_Home') }}</span>
                            <ion-icon name="arrow-back" aria-hidden="true"></ion-icon>
                        </a>
                    </div>
                </div>
            </section>
        </article>
    </main>

    <!-- ionicon link -->
    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>

</body>

</html>
