@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('Student_Dashboard/student_trans.Profile') }}
@stop
@endsection
@section('page-header')
<!-- breadcrumb -->
{{ trans('Student_Dashboard/student_trans.Profile') }}

<!-- breadcrumb -->
@endsection
@section('content')
<!-- row -->

<div class="card-body">

    <x-backend.alert />

    <section style="background-color: #eee; padding:10px">
        <div class="row">
            <div class="col-lg-4">
                <div class="card mb-4">
                    <div class="card-body text-center">
                        <img src="{{ URL::asset('images/icons/student.png') }}" alt="avatar"
                            class="rounded-circle img-fluid" style="width: 150px;">
                        <h5 style="font-family: Cairo" class="my-3">{{ $student->name }}</h5>
                        <p class="text-muted mb-1">{{ $student->email }}</p>
                        <p class="text-muted mb-4">{{ trans('Student_Dashboard/student_trans.Student') }} </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-8">
                <div class="card mb-4">
                    <div class="card-body">
                        <form action="{{ route('student_profile.update', $student->id) }}" method="post">
                            @csrf
                            @method('PUT')
                            <div class="row">
                                <div class="col-12 col-sm-3">
                                    <p class="mb-10">
                                        {{ trans('Student_Dashboard/student_trans.Arabic_User_Name') }}
                                    </p>
                                </div>
                                <div class="col-12 col-sm-9">
                                    <p class="text-muted mb-10">
                                        <input type="text" name="Name_ar"
                                            value="{{ $student->getTranslation('name', 'ar') }}" class="form-control">
                                    </p>
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-12 col-sm-3">
                                    <p class="mb-10">
                                        {{ trans('Student_Dashboard/student_trans.English_User_Name') }}
                                    </p>
                                </div>
                                <div class="col-12 col-sm-9">
                                    <p class="text-muted mb-10">
                                        <input type="text" name="Name_en"
                                            value="{{ $student->getTranslation('name', 'en') }}" class="form-control">
                                    </p>
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-12 col-sm-3">
                                    <p class="mb-10">{{ trans('Student_Dashboard/student_trans.Password') }}</p>
                                </div>
                                <div class="col-12 col-sm-9">
                                    <p class="text-muted mb-10">
                                    <div class="input-group">
                                        <input type="password" id="password" class="form-control" name="password">
                                        <span class="input-group-text">
                                            <i class="far fa-eye" id="togglePassword" style="cursor: pointer;"></i>
                                        </span>
                                    </div>
                                    </p>
                                </div>

                                <div class="col-12 col-sm-3">
                                    <p class="mb-10">
                                        {{ trans('Student_Dashboard/student_trans.Password_confirm') }}
                                    </p>
                                </div>
                                <div class="col-12 col-sm-9">
                                    <p class="text-muted mb-10">
                                    <div class="input-group">
                                        <input type="password" id="password_confirmation" class="form-control"
                                            name="password_confirmation">
                                        <span class="input-group-text">
                                            <i class="far fa-eye" id="togglePasswordConfirm"
                                                style="cursor: pointer;"></i>
                                        </span>
                                    </div>
                                    </p>
                                </div>
                            </div>
                            <hr>
                            <button type="submit"
                                class="btn btn-success">{{ trans('Student_Dashboard/student_trans.Edit_Information') }}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>
<!-- row closed -->
@endsection
@push('scripts')
<script>
    document.getElementById('togglePassword').addEventListener('click', function() {
        const password = document.getElementById('password');
        const type = password.type === 'password' ? 'text' : 'password';
        password.type = type;
        this.classList.toggle('fa-eye-slash');
    });

    document.getElementById('togglePasswordConfirm').addEventListener('click', function() {
        const passwordConfirm = document.getElementById('password_confirmation');
        const type = passwordConfirm.type === 'password' ? 'text' : 'password';
        passwordConfirm.type = type;
        this.classList.toggle('fa-eye-slash');
    });
</script>
@endpush
