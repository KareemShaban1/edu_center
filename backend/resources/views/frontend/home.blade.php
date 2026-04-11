<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--
          - primary meta tag
          -->
    <title>Kari EduCenter - The Best Program to Manage Teacher Education Centers </title>
    <meta name="title" content="Kari EduCenter - The Best Program to Manage Teacher Education Centers">
    <meta name="description" content="Kari EduCenter - The Best Program to Manage Teacher Education Centers">

    <!--
          - favicon
        -->
    <link rel="shortcut icon" href="{{ asset('frontend/favicon.svg') }}" type="image/svg+xml">

    <!--
          - custom css link
        -->
        <link rel="stylesheet" href="{{ asset('frontend/assets/css/bootstrap.min.css') }}">

    <link rel="stylesheet" href="{{ asset('frontend/assets/css/rtl_style.css') }}">

    <!--
          - google font link
        -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700;800&family=Poppins:wght@400;500&display=swap"
        rel="stylesheet">

    <!--
          - preload images
        -->
    <link rel="preload" as="image" href="{{ asset('frontend/assets/images/hero-bg.svg') }}">
    <link rel="preload" as="image" href="{{ asset('frontend/assets/images/hero-banner-1.jpg') }}">
    <link rel="preload" as="image" href="{{ asset('frontend/assets/images/hero-banner-2.jpg') }}">
    <link rel="preload" as="image" href="{{ asset('frontend/assets/images/hero-shape-1.svg') }}">
    <link rel="preload" as="image" href="{{ asset('frontend/assets/images/hero-shape-2.png') }}">

</head>

<body id="top">

    <!--
    - #HEADER
  -->

  <header class="header" data-header>
          <div class="container">
  
              <a href="#" class="logo" style="text-decoration: none;">
                  {{-- <img src="{{ asset('frontend/assets/images/logo.svg') }}" width="162" height="50"
                      alt="EduWeb logo"> --}}
                  <h3 style="direction:ltr; display: flex; font-size:25px; font-weight:bold">
                      <span style="color: var(--kappel); margin-right:10px">Kari</span> eduCenter
                  </h3>
              </a>
  
              <nav class="navbar" data-navbar>
  
                  <div class="wrapper">
                    <a href="#" class="logo" style="text-decoration: none;">
                              {{-- <img src="{{ asset('frontend/assets/images/logo.svg') }}" width="162" height="50"
                                  alt="EduWeb logo"> --}}
                              <h3 style="direction:ltr; display: flex; font-size:25px; font-weight:bold">
                                  <span style="color: var(--kappel); margin-right:10px">Kari</span> eduCenter
                              </h3>
                          </a>
  
                      <button class="nav-close-btn" aria-label="close menu" data-nav-toggler>
                          <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
                      </button>
                  </div>
  
                  <ul class="navbar-list">
  
                      <li class="navbar-item">
                          <a href="#home" class="navbar-link" data-nav-link>{{ trans('frontend/home_trans.Home') }}</a>
                      </li>
  
                      <li class="navbar-item">
                          <a href="#category" class="navbar-link"
                              data-nav-link>{{ trans('frontend/home_trans.About') }}</a>
                      </li>
  
                      <li class="navbar-item">
                          <a href="#admin" class="navbar-link"
                              data-nav-link>{{ trans('frontend/home_trans.admin') }}</a>
                      </li>
  
                      <li class="navbar-item">
                          <a href="#teacher_dashboard" class="navbar-link"
                              data-nav-link>{{ trans('frontend/home_trans.Teacher_Dashboard') }}</a>
                      </li>
  
                      <li class="navbar-item">
                          <a href="#parent_dashboard" class="navbar-link"
                              data-nav-link>{{ trans('frontend/home_trans.Parent_Dashboard') }}</a>
                      </li>
  
                      <li class="navbar-item">
                          <a href="#student_dashboard" class="navbar-link"
                              data-nav-link>{{ trans('frontend/home_trans.Student_Dashboard') }}</a>
                      </li>
  
                      {{-- <li class="navbar-item">
                          <a href="#courses" class="navbar-link" data-nav-link>Courses</a>
                      </li> --}}
  
  
  
                      {{-- <li class="navbar-item">
                          <a href="#" class="navbar-link"
                              data-nav-link>{{ trans('frontend/home_trans.Contact') }}</a>
                      </li> --}}
  
                  </ul>
  
              </nav>
  
              <div class="header-actions">
  
                  <!-- <button class="header-action-btn" aria-label="toggle search" title="Search">
                  <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
                  </button> -->
  
                          <!-- <button class="header-action-btn" aria-label="cart" title="Cart">
                  <ion-icon name="cart-outline" aria-hidden="true"></ion-icon>
  
                  <span class="btn-badge">0</span>
                  </button> -->
  
                  <a href="{{ Route('selection') }}" class="btn has-before">
                      <span class="span">{{ trans('frontend/home_trans.Try for free') }}</span>
  
                      <ion-icon name="arrow-back" aria-hidden="true"></ion-icon>
                  </a>
  
                  <button class="header-action-btn" aria-label="open menu" data-nav-toggler>
                      <ion-icon name="menu-outline" aria-hidden="true"></ion-icon>
                  </button>
  
              </div>
  
              <div class="overlay" data-nav-toggler data-overlay></div>
  
          </div>
      </header>





    <main>
        <article>

            <!--- #HERO-->

            <section class="section hero has-bg-image" id="home" aria-label="home"
                style="background-image: url('{{ asset('frontend/assets/images/hero-bg.svg') }}'); height:700px;">
                <div class="container">

                    <div class="hero-content">

                        <h1 class="h1 section-title">

                            {{ trans('frontend/home_trans.The Best Program to Control Your Education Center') }}
                        </h1>

                        <p class="hero-text">
                            <!-- Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit. -->
                        </p>

                        <a href="{{ Route('selection') }}" class="btn has-before">
                            <span class="span">{{ trans('frontend/home_trans.Try Now') }}</span>

                            <ion-icon name="arrow-back" aria-hidden="true"></ion-icon>
                        </a>

                    </div>

                    <figure class="hero-banner">

                        <!-- <div class="img-holder one" style="--width: 270; --height: 300;">
          <img src="{{ asset('') }}frontend/assets/images/hero-banner-1.jpg" width="270" height="300" alt="hero banner" class="img-cover">
          </div> -->

                        <!-- <div class="img-holder two" style="--width: 240; --height: 370;">
          <img src="{{ asset('') }}frontend/assets/images/hero-banner-2.jpg" width="240" height="370" alt="hero banner" class="img-cover">
          </div> -->

                        <!-- <img src="{{ asset('') }}frontend/assets/images/hero-shape-1.svg" width="380" height="190" alt="" class="shape hero-shape-1"> -->

                        <img src="{{ asset('frontend/assets/images/hero-shape-2.png') }}" width="622"
                            height="551" alt="" class="shape hero-shape-2">

                    </figure>

                </div>
            </section>




            <!--- #CATEGORY -->

            <section class="section category" id="category" aria-label="category">
                <div class="container">

                    <p class="section-subtitle">{{ trans('frontend/home_trans.Dashboards') }} </p>

                    <h2 class="h2 section-title">
                        <span class="span">٤</span>
                        {{ trans('frontend/home_trans.Dashboards') }}
                    </h2>

                    <p class="section-text">
                        {{-- Consectetur adipiscing elit sed do eiusmod tempor. --}}
                    </p>

                    <ul class="grid-list">

                        <li>
                            <div class="category-card" style="--color: 170, 75%, 41%">

                                <div class="card-icon">
                                    <img src="{{ asset('frontend/assets/images/icon-admin.svg') }}" width="40"
                                        height="40" loading="lazy" alt="Online Degree Programs" class="img">
                                </div>

                                <h3 class="h3">
                                    <a href="#"
                                        class="card-title">{{ trans('frontend/home_trans.admin') }}</a>
                                </h3>

                                <p class="card-text">
                                    {{-- Lorem ipsum dolor consec tur elit adicing sed umod tempor. --}}
                                </p>

                                <span class="card-badge">More than 38 page </span>

                            </div>
                        </li>

                        <li>
                            <div class="category-card" style="--color: 351, 83%, 61%">

                                <div class="card-icon">
                                    <img src="{{ asset('frontend/assets/images/teacher.svg') }}" width="40"
                                        height="40" loading="lazy" alt="Non-Degree Programs" class="img">
                                </div>

                                <h3 class="h3">
                                    <a href="#"
                                        class="card-title">{{ trans('frontend/home_trans.Teacher_Dashboard') }}</a>
                                </h3>

                                <p class="card-text">
                                    {{-- Lorem ipsum dolor consec tur elit adicing sed umod tempor. --}}
                                </p>

                                <span class="card-badge">More than 12 page </span>

                            </div>
                        </li>

                        <li>
                            <div class="category-card" style="--color: 229, 75%, 58%">

                                <div class="card-icon">
                                    <img src="{{ asset('frontend/assets/images/parent.svg') }}" width="40"
                                        height="40" loading="lazy" alt="Off-Campus Programs" class="img">
                                </div>

                                <h3 class="h3">
                                    <a href="#"
                                        class="card-title">{{ trans('frontend/home_trans.Parent_Dashboard') }}</a>
                                </h3>

                                <p class="card-text">
                                    {{-- Lorem ipsum dolor consec tur elit adicing sed umod tempor. --}}
                                </p>

                                <span class="card-badge">More than 12 page</span>

                            </div>
                        </li>

                        <li>
                            <div class="category-card" style="--color: 42, 94%, 55%">

                                <div class="card-icon">
                                    <img src="{{ asset('frontend/assets/images/student.svg') }}" width="40"
                                        height="40" loading="lazy" alt="Hybrid Distance Programs" class="img">
                                </div>

                                <h3 class="h3">
                                    <a href="#"
                                        class="card-title">{{ trans('frontend/home_trans.Student_Dashboard') }}</a>
                                </h3>

                                <p class="card-text">
                                    {{-- Lorem ipsum dolor consec tur elit adicing sed umod tempor. --}}
                                </p>

                                <span class="card-badge">More than 9 page</span>

                            </div>
                        </li>

                    </ul>

                </div>
            </section>





            <!--- #Admin Dashboard -->

            <section class="section about" id="admin" aria-label="about">
                <div class="container">

                    <figure class="about-banner col-12">

                              <div class="col-12">
                                        <div class="img-holder" style="--width: 370; --height: 370;">
                                            <img src="{{ asset('screenshots/admin/1_admin.png') }}"
                                                class="img-fluid" loading="lazy" alt="about banner">
                                        </div>
                              </div>

                        {{-- <img src="{{ asset('frontend/assets/images/about-shape-2.svg') }}" width="371"
                                height="220" loading="lazy" alt="" class="shape about-shape-2"> --}}

                        <img src="{{ asset('frontend/assets/images/about-shape-3.png') }}" width="722"
                            height="528" loading="lazy" alt="" class="shape about-shape-3">

                    </figure>

                    <div class="about-content col-12">

                        <p class="section-title">
                            <span class="span" style="font-weight: bold">
                                {{ trans('frontend/home_trans.admin') }}
                            </span>
                        </p>

                        <p class="section-title" style="font-size: 20px; font-weight:bold">
                            {{ trans('frontend/home_trans.The Admin Dashboard is the central control panel that provides full access to manage the entire system.') }}
                            {{-- Over 10 Years in <span class="span">Distant learning</span> for Skill Development --}}
                        </p>

                        <p class="section-text">

                        </p>

                        <ul class="about-list">

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Quick_Dashboard') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Easy_To_Use') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Many_Features') }}</span>
                            </li>

                        </ul>



                    </div>

                </div>
            </section>

            <!--- #Teacher Dashboard -->

            <section class="section about" id="teacher_dashboard" aria-label="about">
                <div class="container">

                    <figure class="about-banner col-12">
                              <div class="col-12">
                                        <div class="img-holder" style="--width: 370; --height: 290;">
                                            <img src="{{ asset('screenshots/teacher_dashboard/1_teacher_dashboard.png') }}"
                                                class="img-fluid" loading="lazy" alt="about banner">
                                        </div>
                              </div>



                        {{-- <img src="{{ asset('frontend/assets/images/about-shape-2.svg') }}" width="371"
                                height="220" loading="lazy" alt="" class="shape about-shape-2"> --}}

                        <img src="{{ asset('frontend/assets/images/about-shape-3.png') }}" width="722"
                            height="528" loading="lazy" alt="" class="shape about-shape-3">

                    </figure>

                    <div class="about-content col-12">

                        <p class="section-title">
                            <span class="span" style="font-weight: bold">
                                {{ trans('frontend/home_trans.Teacher_Dashboard') }}
                            </span>
                        </p>

                        <h2 class="section-title">
                            {{ trans('frontend/home_trans.The Teacher Dashboard is designed to facilitate teachers in managing their classes, students, and academic materials.') }}
                            {{-- Over 10 Years in <span class="span">Distant learning</span> for Skill Development --}}
                        </h2>

                        <p class="section-text">

                        </p>

                        <ul class="about-list">

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Quick_Dashboard') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Easy_To_Use') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Many_Features') }}</span>
                            </li>

                        </ul>



                    </div>

                </div>
            </section>


            <!--- #Parent Dashboard -->

            <section class="section about" id="parent_dashboard" aria-label="about">
                <div class="container">

                    <figure class="about-banner">

                              <div class="col-12">
                                        <div class="img-holder" style="--width: 370; --height: 290;">
                                            <img src="{{ asset('screenshots/parent_dashboard/1_parent_dashboard.png') }}"
                                                class="img-fluid" loading="lazy" alt="about banner">
                                        </div>
                              </div>


                        {{-- <img src="{{ asset('frontend/assets/images/about-shape-2.svg') }}" width="371"
                                height="220" loading="lazy" alt="" class="shape about-shape-2"> --}}

                        <img src="{{ asset('frontend/assets/images/about-shape-3.png') }}" width="722"
                            height="528" loading="lazy" alt="" class="shape about-shape-3">

                    </figure>

                    <div class="about-content">

                        <p class="section-title">
                            <span class="span" style="font-weight: bold">
                                {{ trans('frontend/home_trans.Parent_Dashboard') }}
                            </span>
                        </p>

                        <h2 class="section-title">
                            {{ trans("frontend/home_trans.The Parent Dashboard provides parents with an interface to monitor and engage in their child's academic journey") }}
                            {{-- Over 10 Years in <span class="span">Distant learning</span> for Skill Development --}}
                        </h2>

                        <p class="section-text">

                        </p>

                        <ul class="about-list">

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Quick_Dashboard') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Easy_To_Use') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Many_Features') }}</span>
                            </li>

                        </ul>



                    </div>

                </div>
            </section>


            <!--- #Student Dashboard -->

            <section class="section about" id="student_dashboard" aria-label="about">
                <div class="container">

                    <figure class="about-banner">

                              <div class="col-12">
                                        <div class="img-holder" style="--width: 370; --height: 290;">
                                            <img src="{{ asset('screenshots/student_dashboard/1_student_dashboard.png') }}"
                                                class="img-fluid" loading="lazy" alt="about banner">
                                        </div>
                              </div>


                        {{-- <img src="{{ asset('frontend/assets/images/about-shape-2.svg') }}" width="371"
                                height="220" loading="lazy" alt="" class="shape about-shape-2"> --}}

                        <img src="{{ asset('frontend/assets/images/about-shape-3.png') }}" width="722"
                            height="528" loading="lazy" alt="" class="shape about-shape-3">

                    </figure>

                    <div class="about-content">

                        <p class="section-title">
                            <span class="span" style="font-weight: bold">
                                {{ trans('frontend/home_trans.Student_Dashboard') }}
                            </span>
                        </p>

                        <h2 class="section-title">
                            {{ trans('frontend/home_trans.The Student Dashboard allows students to keep track of their academic activities .') }}
                            {{-- Over 10 Years in <span class="span">Distant learning</span> for Skill Development --}}
                        </h2>

                        <p class="section-text">

                        </p>

                        <ul class="about-list">

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Quick_Dashboard') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Easy_To_Use') }}</span>
                            </li>

                            <li class="about-item">
                                <ion-icon name="checkmark-done-outline" aria-hidden="true"></ion-icon>

                                <span class="span">{{ trans('frontend/home_trans.Many_Features') }}</span>
                            </li>

                        </ul>

                        {{-- <img src="{{ asset('frontend/assets/images/about-shape-4.svg') }}" width="100"
                                height="100" loading="lazy" alt="" class="shape about-shape-4"> --}}

                    </div>

                </div>
            </section>












          <!--- #STATE-->

          {{-- <section class="section stats" aria-label="stats">
          <div class="container">

          <ul class="grid-list">

                    <li>
                    <div class="stats-card" style="--color: 170, 75%, 41%">
                              <h3 class="card-title">29.3k</h3>

                              <p class="card-text">Student Enrolled</p>
                    </div>
                    </li>

                    <li>
                    <div class="stats-card" style="--color: 351, 83%, 61%">
                              <h3 class="card-title">32.4K</h3>

                              <p class="card-text">Class Completed</p>
                    </div>
                    </li>

                    <li>
                    <div class="stats-card" style="--color: 260, 100%, 67%">
                              <h3 class="card-title">100%</h3>

                              <p class="card-text">Satisfaction Rate</p>
                    </div>
                    </li>

                    <li>
                    <div class="stats-card" style="--color: 42, 94%, 55%">
                              <h3 class="card-title">354+</h3>

                              <p class="card-text">Top Instructors</p>
                    </div>
                    </li>

          </ul>

          </div>
          </section> --}}





            <!--
        - #BLOG
      -->

           
        </article>
    </main>





    <!--
    - #FOOTER
  -->

    <footer class="footer" style="background-image: url('{{ asset('frontend/assets/images/footer-bg.png') }}')">

        <div class="footer-top section">
            <div class="container grid-list">

                <div class="footer-brand">
                    <a href="#" class="logo" style="display: block; text-align: center; text-decoration: none;">
                              {{-- <img src="./assets/images/logo-light.svg" width="162" height="50" alt="EduWeb logo"> --}}
                              <h3 style="font-size: 25px; font-weight: bold; display: inline; margin: 0; padding: 0;">
                                  <span style="color: var(--kappel); margin-right: 10px; display: inline;">Kari</span> eduCenter
                              </h3>
                          </a>
                    {{-- <a href="#" class="logo" style="display: inline-block; text-decoration: none; text-align:center">
                              
                              <h3 style="font-size: 25px; font-weight: bold; display: inline; margin: 0; padding: 0;">
                                  <span style="color: var(--kappel); margin-right: 10px; display: inline;">Kari</span> eduCenter
                              </h3>
                          </a> --}}

                          

                    <p class="footer-brand-text" style="text-align: right">
                              {{ trans('frontend/home_trans.A Teacher Education Center System built with Laravel and featuring four distinct dashboards (Admin, Teacher, Parent, and Student) can help manage various aspects of the educational process.') }}
                    </p>

                    {{-- <div class="wrapper">
                              <span class="span">{{ trans('frontend/home_trans.Phone') }}</span>
      
                              <a href="tel:+01090537394" class="footer-link">01090537394</a>
                          </div>
      
                          <div class="wrapper">
                              <span class="span">{{ trans('frontend/home_trans.Email') }}</span>
      
                              <a href="mailto:shabankareem919@gmail.com" class="footer-link">shabankareem919@gmail.com</a>
                          </div> --}}

                </div>

                <ul class="footer-list" style="text-align: right">

                    <li>
                        <p class="footer-list-title">{{ trans('frontend/home_trans.Links') }}</p>
                    </li>

                    <li>
                        <a href="#" class="footer-link">{{ trans('frontend/home_trans.About') }}</a>
                    </li>

                    <li>
                        <a href="#" class="footer-link">{{ trans('frontend/home_trans.admin') }}</a>
                    </li>

                    <li>
                        <a href="#"
                            class="footer-link">{{ trans('frontend/home_trans.Teacher_Dashboard') }}</a>
                    </li>

                    <li>
                        <a href="#" class="footer-link">{{ trans('frontend/home_trans.Parent_Dashboard') }}</a>
                    </li>

                    <li>
                        <a href="#"
                            class="footer-link">{{ trans('frontend/home_trans.Student_Dashboard') }}</a>
                    </li>



                </ul>

                {{-- <ul class="footer-list">

                    <li>
                        <p class="footer-list-title">Links</p>
                    </li>

                    <li>
                        <a href="#" class="footer-link">Contact Us</a>
                    </li>

                    <li>
                        <a href="#" class="footer-link">Gallery</a>
                    </li>

                    <li>
                        <a href="#" class="footer-link">News & Articles</a>
                    </li>

                    <li>
                        <a href="#" class="footer-link">FAQ's</a>
                    </li>

                    <li>
                        <a href="#" class="footer-link">Sign In/Registration</a>
                    </li>

                    <li>
                        <a href="#" class="footer-link">Coming Soon</a>
                    </li>

                </ul>

                <div class="footer-list">

                    <p class="footer-list-title">Contacts</p>

                    <p class="footer-list-text">
                        Enter your email address to register to our newsletter subscription
                    </p>

                    <form action="" class="newsletter-form">
                        <input type="email" name="email_address" placeholder="Your email" required
                            class="input-field">

                        <button type="submit" class="btn has-before">
                            <span class="span">Subscribe</span>

                            <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
                        </button>
                    </form>

                    <ul class="social-list">

                        <li>
                            <a href="#" class="social-link">
                                <ion-icon name="logo-facebook"></ion-icon>
                            </a>
                        </li>

                        <li>
                            <a href="#" class="social-link">
                                <ion-icon name="logo-linkedin"></ion-icon>
                            </a>
                        </li>

                        <li>
                            <a href="#" class="social-link">
                                <ion-icon name="logo-instagram"></ion-icon>
                            </a>
                        </li>

                        <li>
                            <a href="#" class="social-link">
                                <ion-icon name="logo-twitter"></ion-icon>
                            </a>
                        </li>

                        <li>
                            <a href="#" class="social-link">
                                <ion-icon name="logo-youtube"></ion-icon>
                            </a>
                        </li>

                    </ul>

                </div> --}}

            </div>
        </div>

                    <!-- <div class="footer-bottom">
                    <div class="container">

                    <p class="copyright">
                              Copyright 2022 All Rights Reserved by <a href="#" class="copyright-link">codewithsadee</a>
                    </p>

                    </div>
                    </div> -->

    </footer>





    <!--
    - #BACK TO TOP
  -->

    <a href="#top" class="back-top-btn" aria-label="back top top" data-back-top-btn>
        <ion-icon name="chevron-up" aria-hidden="true"></ion-icon>
    </a>





    <!--
    - custom js link -->
    <script src="{{ asset('frontend/assets/js/script.js') }}" defer></script>

    <!--
    - ionicon link-->
    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>

</body>

</html>
