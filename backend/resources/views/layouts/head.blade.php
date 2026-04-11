<title>@yield('title')</title>

<link rel="shortcut icon" href="{{ asset('assets/images/favicon.ico') }}" type="image/x-icon" />


<script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>


<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>

<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css" rel="stylesheet" media="print"
          onload="this.media='all'">

<link href="{{ asset('assets/css/wizard.css') }}" rel="stylesheet" id="bootstrap-css">

@yield('css')

@if (App::getLocale() == 'en')
<link href="{{ asset('assets/css/ltr.css') }}" rel="stylesheet">
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
@else
<link href="{{ asset('assets/css/rtl.min.css') }}" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2-rtl/css/bootstrap.min.css">
@endif


<script src="https://cdn.tailwindcss.com" defer></script>

<link href="{{ asset('assets/css/responsive.css') }}" rel="stylesheet">

<meta name="csrf-token" content="{{ csrf_token() }}">

<style>
.notifications-scroll {
          max-height: 300px;
          /* or any height you prefer */
          overflow-y: auto;
}

.dataTables_filter {
          text-align: left !important;
          /* Flip to right if RTL */
}

.dataTables_filter input {
          margin-left: 0.5em;
}
</style>

@stack('styles')
