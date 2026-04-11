@extends('layouts.master')


@section('title')
    الاقسام الدراسية
@endsection

@section('page-header')
    <!-- breadcrumb -->

    <div class="row">
        <div class="col-sm-6">
            <h4 class="mb-0" style="font-family: 'Cairo', sans-serif">مرحبا بك :
                {{ auth()->user()->name }}
            </h4>
        </div><br><br>
        <div class="col-sm-6">
            <ol class="breadcrumb pt-0 pr-0 float-left float-sm-right">
            </ol>
        </div>
    </div>

<!-- breadcrumb -->
@endsection
@section('content')

<div class="col-xl-12 mb-30 p-0">
    <div class="card h-100">
        <div class="card-body">

            <livewire:calendar />

        </div>
    </div>
</div>

@endsection

@push('scripts')
<script>
    window.onload = function() {
        $('.fc-toolbar.fc-header-toolbar').addClass('row col-12 col-lg-12');
    };

    // add the responsive classes when navigating with calendar buttons
    $(document).on('click', '.fc-button', function(e) {
        $('.fc-toolbar.fc-header-toolbar').addClass('row col-12 col-lg-12');
    });
</script>
@endpush
