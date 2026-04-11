@extends('layouts.master')
@section('css')

@section('title')
    {{ trans('admin/dashboard_trans.Dashboard') }}
@stop

@endsection

@section('page-header')
<!-- breadcrumb -->
{{ trans('admin/dashboard_trans.Dashboard') }}
<!-- breadcrumb -->
@endsection

@section('content')

<div class="row">
    <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <div class="clearfix">
                    <div class="float-right">
                        <span class="text-success">
                            <i class="fas fa-user-graduate highlight-icon" aria-hidden="true"></i>
                        </span>
                    </div>
                    <div class="float-left text-left">
                        <p class="card-text text-dark">
                            {{ trans('admin/dashboard_trans.Number_of_Students') }}
                        </p>
                        <h4>{{ \App\Models\Student::count() }}</h4>
                    </div>
                </div>
                <p class="text-muted pt-3 mb-0 mt-2 border-top">
                    <i class="fas fa-binoculars mr-1" aria-hidden="true"></i><a href="{{ route('students.index') }}"
                        target="_blank"><span class="text-danger">
                            {{ trans('admin/dashboard_trans.Show_Information') }}
                        </span></a>
                </p>
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <div class="clearfix">
                    <div class="float-right">
                        <span class="text-warning">
                            <i class="fas fa-chalkboard-teacher highlight-icon" aria-hidden="true"></i>
                        </span>
                    </div>
                    <div class="float-left text-left">
                        <p class="card-text text-dark">{{ trans('admin/dashboard_trans.Number_of_Teachers') }}
                        </p>
                        <h4>{{ \App\Models\Teacher::count() }}</h4>
                    </div>
                </div>
                <p class="text-muted pt-3 mb-0 mt-2 border-top">
                    <i class="fas fa-binoculars mr-1" aria-hidden="true"></i><a href="{{ route('teachers.index') }}"
                        target="_blank"><span class="text-danger">
                            {{ trans('admin/dashboard_trans.Show_Information') }}
                        </span></a>
                </p>
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <div class="clearfix">
                    <div class="float-right">
                        <span class="text-success">
                            <i class="fas fa-user-tie highlight-icon" aria-hidden="true"></i>
                        </span>
                    </div>
                    <div class="float-left text-left">
                        <p class="card-text text-dark">
                            {{ trans('admin/dashboard_trans.Number_of_Parents') }}
                        </p>
                        <h4>{{ \App\Models\Parents::count() }}</h4>
                    </div>
                </div>
                <p class="text-muted pt-3 mb-0 mt-2 border-top">
                    <i class="fas fa-binoculars mr-1" aria-hidden="true"></i><a href="{{ route('parents.index') }}"
                        target="_blank"><span class="text-danger">
                            {{ trans('admin/dashboard_trans.Show_Information') }}
                        </span></a>
                </p>
            </div>
        </div>
    </div>
    <div class="col-xl-3 col-lg-6 col-md-6 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <div class="clearfix">
                    <div class="float-right">
                        <span class="text-primary">
                            <i class="fas fa-chalkboard highlight-icon" aria-hidden="true"></i>
                        </span>
                    </div>
                    <div class="float-left text-left">
                        <p class="card-text text-dark">
                            {{ trans('admin/dashboard_trans.Number_of_Sections') }}</p>
                        <h4>{{ \App\Models\Section::count() }}</h4>
                    </div>
                </div>
                <p class="text-muted pt-3 mb-0 mt-2 border-top">
                    <i class="fas fa-binoculars mr-1" aria-hidden="true"></i><a href="{{ route('sections.index') }}"
                        target="_blank"><span class="text-danger">
                            {{ trans('admin/dashboard_trans.Show_Information') }}
                        </span></a>
                </p>
            </div>
        </div>
    </div>
</div>



<div class="row">

    <div style="height: 400px;" class=" col-lg-4 col-md-4 col-sm-12 col-12 p-2">

        <div class="card card-statistics h-100">

            <div class="col-12  p-0 main-box">
                <div class="col-12 px-0">
                    <div class="col-12 px-3 py-3">
                        {{ trans('admin/dashboard_trans.Fast_Processes') }}
                    </div>
                    <div class="col-12 " style="min-height: 1px;background: #f1f1f1;"></div>
                </div>
                <div class="col-12 p-3 row d-flex">
                    <div class="col-4  d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="{{ route('students.index') }}" target="_blank" style="color:inherit;">
                            <div class="col-12 p-0 text-center">
                                <img src="{{ asset('images/icons/student.png') }}" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-home font-5" ></span> --}}
                                <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Students') }}
                                </div>
                            </div>
                        </a>
                    </div>

                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="{{ route('parents.index') }}" style="color:inherit;">
                            <div class="col-12 p-0 text-center">
                                <img src="/images/icons/parents.png" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-bells font-5" ></span> --}}
                                <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Parents') }}
                                </div>
                            </div>
                        </a>
                    </div>

                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="{{ route('attendance.show_groups') }}" style="color:inherit;">
                            <div class="col-12 p-0 text-center">
                                <img src="/images/icons/attendance.png" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-bullhorn font-5" ></span> --}}
                                <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Attendance') }}
                                </div>
                            </div>
                        </a>
                    </div>

                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="{{ route('QuizDegree.showGroups') }}" style="color:inherit;">
                            <div class="col-12 p-0 text-center">
                                <img src="/images/icons/quiz.png" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-wrench font-5" ></span> --}}
                                <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Quizzes') }}
                                </div>
                            </div>
                        </a>
                    </div>

                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="{{ route('ExamDegree.showGroups') }}" style="color:inherit;">
                            <div class="col-12 p-0 text-center">
                                <img src="/images/icons/exam.png" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-user font-5" ></span> --}}
                                <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Exams') }}
                                </div>
                            </div>
                        </a>
                    </div>
                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="{{ route('announcements.index') }}" style="color:inherit;">
                            <div class="col-12 p-0 text-center">
                                <img src="/images/icons/announcement.png" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-user-edit font-5" ></span> --}}
                                <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Announcements') }}
                                </div>
                            </div>
                        </a>
                    </div>

                    <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="{{ route('Payment.showGroups') }}"style="color:inherit;">
                            <div class="col-12 p-0 text-center">
                                <img src="/images/icons/fees.png" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-sign-out-alt font-5" ></span> --}}
                                <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Fees') }}
                                </div>
                            </div>
                        </a>
                    </div>




                    {{-- <div class="col-4 d-flex justify-content-center align-items-center mb-3 py-2">
                        <a href="#"
                            onclick="event.preventDefault();document.getElementById('logout-form').submit();"
                            style="color:inherit;">
                            <div class="col-12 p-0 text-center">

                                <img src="/images/icons/logout.png" style="width:30px;height: 30px">
                                {{-- <span class="fal fa-sign-out-alt font-5" ></span> --}}
                                {{-- <div class="col-12 p-0 text-center">
                                    {{ trans('admin/dashboard_trans.Logout') }}
                                {{-- </div> --}}
                            {{-- </div>
                        </a>
                    </div>  --}}


                </div>
            </div>

        </div>
    </div>


    <div class="col-12 col-xl-8 col-md-8 col-sm-12 mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">
                <div class="tab nav-border" style="position: relative;">
                    <div class="d-block d-md-flex justify-content-between">
                        <div class="d-block w-100">
                            <h5 style="font-family: 'Cairo', sans-serif" class="card-title">

                                {{ trans('admin/dashboard_trans.Last_Processes_On_System') }}
                            </h5>
                        </div>
                        <div class="d-block d-md-flex nav-tabs-custom">
                            <ul class="nav nav-tabs" id="myTab" role="tablist">

                                <li class="nav-item">
                                    <a class="nav-link active show" id="students-tab" data-toggle="tab"
                                        href="#students" role="tab" aria-controls="students"
                                        aria-selected="true">
                                        {{ trans('admin/dashboard_trans.Students') }}
                                    </a>
                                </li>

                                <li class="nav-item">
                                    <a class="nav-link" id="teachers-tab" data-toggle="tab" href="#teachers"
                                        role="tab" aria-controls="teachers" aria-selected="false">
                                        {{ trans('admin/dashboard_trans.Teachers') }}
                                    </a>
                                </li>

                                <li class="nav-item">
                                    <a class="nav-link" id="parents-tab" data-toggle="tab" href="#parents"
                                        role="tab" aria-controls="parents" aria-selected="false">
                                        {{ trans('admin/dashboard_trans.Parents') }}
                                    </a>
                                </li>


                            </ul>
                        </div>
                    </div>
                    <div class="tab-content" id="myTabContent">

                        {{-- students Table --}}
                        <div class="tab-pane fade active show" id="students" role="tabpanel"
                            aria-labelledby="students-tab">
                            <div class="table-responsive mt-15">
                                <table style="text-align: center" class="table center-aligned-table table-hover mb-0">
                                    <thead>
                                        <tr class="table-info text-danger">
                                            <th>#</th>
                                            <th>{{ trans('admin/dashboard_trans.Student_Name') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Email') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Grade') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Class') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Section') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Created_Date') }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @forelse(\App\Models\Student::latest()->take(5)->get() as $student)
                                            <tr>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $student->name }}</td>
                                                <td>{{ $student->email }}</td>
                                                <td>{{ $student->grade->grade_name }}</td>
                                                <td>{{ $student->class->class_name }}</td>
                                                <td>{{ $student->section->section_name }}</td>
                                                <td class="text-success">{{ $student->created_at }}</td>
                                            @empty
                                                <td class="alert-danger" colspan="8">لاتوجد بيانات</td>
                                            </tr>
                                        @endforelse
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {{-- teachers Table --}}
                        <div class="tab-pane fade" id="teachers" role="tabpanel" aria-labelledby="teachers-tab">
                            <div class="table-responsive mt-15">
                                <table style="text-align: center" class="table center-aligned-table table-hover mb-0">
                                    <thead>
                                        <tr class="table-info text-danger">
                                            <th>#</th>
                                            <th> {{ trans('admin/dashboard_trans.Teacher_Name') }}</th>
                                            <th> {{ trans('admin/dashboard_trans.Gender') }}</th>
                                            <th> {{ trans('admin/dashboard_trans.Joining_Date') }}</th>
                                            <th> {{ trans('admin/dashboard_trans.Subject') }}</th>
                                            <th> {{ trans('admin/dashboard_trans.Created_Date') }}</th>
                                        </tr>
                                    </thead>

                                    @forelse(\App\Models\Teacher::latest()->take(5)->get() as $teacher)
                                        <tbody>
                                            <tr>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $teacher->name }}</td>
                                                <td>{{ $teacher->gender }}</td>
                                                <td>{{ $teacher->joining_date }}</td>
                                                <td>{{ $teacher->subject }}</td>
                                                <td class="text-success">{{ $teacher->created_at }}</td>
                                            @empty
                                                <td class="alert-danger" colspan="8">
                                                    {{ trans('admin/dashboard_trans.No_Data') }}</td>
                                            </tr>
                                        </tbody>
                                    @endforelse
                                </table>
                            </div>
                        </div>

                        {{-- parents Table --}}
                        <div class="tab-pane fade" id="parents" role="tabpanel" aria-labelledby="parents-tab">
                            <div class="table-responsive mt-15">
                                <table style="text-align: center" class="table center-aligned-table table-hover mb-0">
                                    <thead>
                                        <tr class="table-info text-danger">
                                            <th>#</th>
                                            <th>{{ trans('admin/dashboard_trans.Parent_Name') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Email') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Address') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Phone') }}</th>
                                            <th>{{ trans('admin/dashboard_trans.Created_Date') }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @forelse(\App\Models\Parents::latest()->take(5)->get() as $parent)
                                            <tr>
                                                <td>{{ $loop->iteration }}</td>
                                                <td>{{ $parent->father_name }}</td>
                                                <td>{{ $parent->email }}</td>
                                                <td>{{ $parent->father_address }}</td>
                                                <td>{{ $parent->father_phone }}</td>
                                                <td class="text-success">{{ $parent->created_at }}</td>
                                            @empty
                                                <td class="alert-danger" colspan="8">لاتوجد بيانات</td>
                                            </tr>
                                        @endforelse
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {{-- sections Table --}}
                        <div class="tab-pane fade" id="fee_invoices" role="tabpanel"
                            aria-labelledby="fee_invoices-tab">
                            <div class="table-responsive mt-15">
                                <table style="text-align: center" class="table center-aligned-table table-hover mb-0">
                                    <thead>
                                        <tr class="table-info text-danger">
                                            <th>#</th>
                                            <th>تاريخ الفاتورة</th>
                                            <th>اسم الطالب</th>
                                            <th>المرحلة الدراسية</th>
                                            <th>الصف الدراسي</th>
                                            <th>القسم</th>
                                            <th>نوع الرسوم</th>
                                            <th>المبلغ</th>
                                            <th>تاريخ الاضافة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {{-- @forelse(\App\Models\Fee_invoice::latest()->take(10)->get() as $section)
                                                    <tr>
                                                        <td>{{$loop->iteration}}</td>
                                                        <td>{{$section->invoice_date}}</td>
                                                        <td>{{$section->My_classs->Name_Class}}</td>
                                                        <td class="text-success">{{$section->created_at}}</td>
                                                    </tr>
                                                @empty
                                                    <tr>
                                                        <td class="alert-danger" colspan="9">لاتوجد بيانات</td>
                                                    </tr>
                                                @endforelse --}}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    </div>

</div>

{{-- <livewire:calendar /> --}}
@livewire('calendar')

<!--================================= wrapper -->

<!--================================= footer -->
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
