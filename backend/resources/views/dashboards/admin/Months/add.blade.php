@extends('layouts.master')
@section('css')

@section('title')
          أضافة الشهور
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
<div class="page-title">
    <div class="row">
        <div class="col-sm-6">
            <h4 class="mb-0">  أضافة الشهور</h4>
        </div>
        <div class="col-sm-6">
            <ol class="breadcrumb pt-0 pr-0 float-left float-sm-right ">
                <li class="breadcrumb-item"><a href="#" class="default-color">أضافة الشهور</a></li>
                <li class="breadcrumb-item active"> الشهور</li>
            </ol>
        </div>
    </div>
</div>
<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->
<div class="row">
    <div class="col-md-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                @if ($errors->any())
                <div class="alert alert-danger">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
                @endif

                <form method="post" enctype="multipart/form-data" action="{{Route('months.store')}}" autocomplete="off">
                    @csrf
                  


                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label> أسم الشهر <span class="text-danger">*</span></label>
                                <input  type="text" name="title"  class="form-control" >
                               
                            </div>
                        </div>

                        <div class="col-lg-6 col-md-6 col-sm-12">
                            <div class="form-group">
                                <label>رقم الشهر  </label>
                                <input  type="text" name="value"  class="form-control">
                            </div>
                        </div>


                      
                    </div>

             
                   <button type="submit" class="btn btn-success btn-md nextBtn btn-lg " >أضافة</button>


                </form>

                
            </div>
        </div>
    </div>
</div>
<!-- row closed -->
@endsection
@push('scripts')

@endpush
