<div class="scrollbar side-menu-bg" style="overflow: scroll">
    <ul class="nav navbar-nav side-menu" id="sidebarnav">
        <!-- menu item Dashboard-->
        <li>
            <a href="{{ route('teacher_dashboard.index') }}">
                <div class="pull-left"><i class="ti-home"></i><span
                        class="right-nav-text">
                        {{trans('Teacher_Dashboard/sidebar_trans.Dashboard')}} 
                </span>
                </div>
                <div class="clearfix"></div>
            </a>
        </li>
        <!-- menu title -->
        {{-- <li class="mt-10 mb-10 text-muted pl-4 font-medium menu-title">{{trans('main_trans.Programname')}} </li> --}}

        <!-- الاقسام-->
        <li>
            <a href="{{route('teacher_dashboard.TeacherGroups')}}"><i class="fas fa-chalkboard"></i><span
                    class="right-nav-text">
                    {{trans('Teacher_Dashboard/sidebar_trans.Sections')}} 
                </span></a>
        </li>

        <!-- الطلاب-->
        <li>
            <a href="{{route('teacher_dashboard.showGroups')}}"><i class="fas fa-user-graduate"></i><span
                    class="right-nav-text">
                    {{trans('Teacher_Dashboard/sidebar_trans.Attendance')}} 
                </span></a>
        </li>


        <!-- Online classes-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Onlineclasses-icon">
                <div class="pull-left"><i class="fas fa-video"></i><span class="right-nav-text">
                    {{trans('Teacher_Dashboard/sidebar_trans.Online_Classes')}} </span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Onlineclasses-icon" class="collapse" data-parent="#sidebarnav">
                <li> 
                    <a href="{{route('teacher_meetings.index')}}">
                        {{trans('Teacher_Dashboard/sidebar_trans.Online_Classes')}} 
                    </a> 
                </li>
                <li> 
                    <a href="{{route('teacher_meetings.show_groups')}}"> 
                        {{trans('Teacher_Dashboard/sidebar_trans.Add_Online_Class')}} 
                    </a> 
                </li>
                <li>
                    <a href="{{route('teacher_meeting_series.index')}}">
                        Weekly Series
                    </a>
                </li>
                <li>
                    <a href="{{route('teacher_meeting_series.show_groups')}}">
                        Add Weekly Series
                    </a>
                </li>
            </ul>
        </li>



        <!-- Reports-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#sections-menu1">
                <div class="pull-left"><i class="fas fa-chalkboard"></i><span
                        class="right-nav-text">
                        {{trans('Teacher_Dashboard/sidebar_trans.Reports')}} 
                    </span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="sections-menu1" class="collapse" data-parent="#sidebarnav">
                <li>
                    <a href="{{route('teacher_dashboard.attendanceSearchView')}}">
                    {{trans('Teacher_Dashboard/sidebar_trans.Attendance_Search')}} 
                    </a>
                </li> 
                <li>
                    <a href="{{route('teacher_dashboard.attendanceReport')}}">
                        {{trans('Teacher_Dashboard/sidebar_trans.Attendance_Report')}} 
                    </a>
                </li>
                <li>
                    <a href="{{route('teacher_dashboard.examReport')}}">
                        {{trans('Teacher_Dashboard/sidebar_trans.Exam_Report')}} 
                    </a>
                </li>
                <li>
                    <a href="{{route('teacher_dashboard.quizReport')}}">
                        {{trans('Teacher_Dashboard/sidebar_trans.Quiz_Report')}} 
                    </a>
                </li>
                <li>
                    <a href="{{route('teacher_dashboard.paymentReport')}}">
                        {{trans('Teacher_Dashboard/sidebar_trans.Payment_Report')}} 
                    </a>
                </li>

            </ul>

        </li>

        

    </ul>
</div>
