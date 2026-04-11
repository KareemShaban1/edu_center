<div class="scrollbar side-menu-bg" style="overflow: scroll">
    <ul class="nav navbar-nav side-menu" id="sidebarnav">
        <!-- menu item Dashboard-->
        <li>
            <a href="{{ url('/dashboard') }}">
                <div class="pull-left"><i class="ti-home"></i><span
                        class="right-nav-text">{{ trans('main_trans.Dashboard') }}</span>
                </div>
                <div class="clearfix"></div>
            </a>
        </li>
        <!-- menu title -->
        {{-- <li class="mt-10 mb-10 text-muted pl-4 font-medium menu-title">{{trans('main_trans.Programname')}} </li> --}}

       
        <!-- users-management-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#users-management">
                <div class="pull-left"><i class="fas fa-user"></i></i><span
                        class="right-nav-text">{{ trans('main_trans.Users_Management') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="users-management" class="collapse" data-parent="#sidebarnav">
            <li> <a href="{{ route('activity-logs.index') }}">{{ trans('main_trans.List_Activity_Logs') }}</a> </li>
                <li> <a href="{{ route('roles.index') }}">{{ trans('main_trans.List_Roles') }}</a> </li>
                <li> <a href="{{ route('users.index') }}">{{ trans('main_trans.List_Users') }}</a> </li>

            </ul>
        </li>
        

       

        <!-- Teachers-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Teachers-menu">
                <div class="pull-left"><i class="fas fa-chalkboard-teacher"></i></i><span
                        class="right-nav-text">{{ trans('main_trans.Teachers') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Teachers-menu" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ route('teachers.index') }}">{{ trans('main_trans.List_Teachers') }}</a> </li>
            </ul>
        </li>


        <!-- students -->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#students-menu">
                <div class="pull-left"><i class="fas fa-user-graduate" aria-hidden="true"></i><span
                        class="right-nav-text">{{ trans('main_trans.Students_Parents_Management') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="students-menu" class="collapse" data-parent="#sidebarnav">
                <!-- <li> <a href="{{ url('add_parent') }}">{{ trans('main_trans.List_Parents') }}</a> </li> -->
                <li> <a href="{{ route('parents.index') }}">{{ trans('main_trans.List_Parents') }}</a></li>
                <li> <a href="{{ route('students.index') }}">{{ trans('main_trans.list_students') }}</a></li>
            </ul>
        </li>


        <!-- Grades & Classes & Sections -->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Grades-menu">
                <div class="pull-left"><i class="fas fa-school"></i><span
                        class="right-nav-text">{{ trans('main_trans.Grade_Class_Section_Management') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Grades-menu" class="collapse" data-parent="#sidebarnav">
                <li><a href="{{ route('grades.index') }}">{{ trans('main_trans.Grades_list') }}</a></li>
                <li><a href="{{ route('classes.index') }}">{{ trans('main_trans.List_classes') }}</a></li>
                <li><a href="{{ route('sections.index') }}">{{ trans('main_trans.List_sections') }}</a></li>


            </ul>
        </li>
       


        <!-- Units & Lessons -->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Units-Lessons-menu">
                <div class="pull-left"><i class="fas fa-chalkboard"></i></i><span
                        class="right-nav-text">{{ trans('main_trans.Units_Lessons_Management') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Units-Lessons-menu" class="collapse" data-parent="#sidebarnav">
                <li><a href="{{ route('units.index') }}">{{ trans('main_trans.List_Units') }}</a></li>
                <li><a href="{{ route('lessons.index') }}">{{ trans('main_trans.List_Lessons') }}</a></li>

            </ul>
        </li>

        

        <!-- Attendance-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Attendance-icon">
                <div class="pull-left"><i class="fas fa-calendar-alt"></i><span
                        class="right-nav-text">{{ trans('main_trans.Attendance') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Attendance-icon" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ route('attendance.show_groups') }}">{{ trans('main_trans.Show_Group') }}</a> </li>
            </ul>
        </li>


        <!-- Homework-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Homework-icon">
                <div class="pull-left"><i class="fas fa-book-open"></i><span
                        class="right-nav-text">{{ trans('main_trans.Homework') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Homework-icon" class="collapse" data-parent="#sidebarnav">
            <li> <a href="{{ Route('homework.index') }}">{{ trans('main_trans.List_Homework') }}</a> </li>
                <li> <a href="{{ Route('homework.showGroups') }}">{{ trans('main_trans.Show_Group') }}</a> </li>
            </ul>
        </li>


        {{-- Exams & Quizzes --}}
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Exams-icon">
                <div class="pull-left"><i class="fas fa-book-open"></i><span
                        class="right-nav-text">{{ trans('main_trans.Exam_Quiz') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Exams-icon" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ Route('ExamDegree.showGroups') }}">{{ trans('main_trans.Exam') }}</a> </li>
                <li> <a href="{{ Route('QuizDegree.showGroups') }}">{{ trans('main_trans.Quiz') }}</a> </li>
            </ul>
        </li>



        <!-- Payment-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Payment-menu">
                <div class="pull-left"><i class="fas fa-money-bill-wave-alt"></i><span
                        class="right-nav-text">{{ trans('main_trans.Accounts') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Payment-menu" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ route('fees.index') }}">{{ trans('main_trans.Fees') }}</a> </li>
                <li> <a href="{{ route('Payment.showGroups') }}"> {{ trans('main_trans.Payment') }}</a> </li>

            </ul>
        </li>



        <!-- Announcements-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Announcements-menu">
                <div class="pull-left"><i class="fas fa-bell"></i><span
                        class="right-nav-text">{{ trans('main_trans.Announcements') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Announcements-menu" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ route('announcements.index') }}">{{ trans('main_trans.Announcements') }}</a> </li>
                <li> <a href="{{ route('announcements.create') }}"> {{ trans('main_trans.Add_Announcement') }}</a>
                </li>

            </ul>
        </li>

        





        <!-- books-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#library-icon">
                <div class="pull-left"><i class="fas fa-book"></i><span
                        class="right-nav-text">{{ trans('main_trans.Books') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="library-icon" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ route('library.index') }}">{{ trans('main_trans.Books_List') }}</a> </li>
            </ul>
        </li>


        <!-- Online classes-->
        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#Onlineclasses-icon">
                <div class="pull-left"><i class="fas fa-video"></i><span
                        class="right-nav-text">{{ trans('main_trans.Onlineclasses') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="Onlineclasses-icon" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ route('meetings.index') }}">{{ trans('main_trans.Online_Classes') }}</a> </li>
            </ul>
        </li>


        <li>
            <a href="javascript:void(0);" data-toggle="collapse" data-target="#templates-menu">
                <div class="pull-left"><i class="fas fa-bell"></i><span
                        class="right-nav-text">{{ trans('main_trans.Templates') }}</span></div>
                <div class="pull-right"><i class="ti-plus"></i></div>
                <div class="clearfix"></div>
            </a>
            <ul id="templates-menu" class="collapse" data-parent="#sidebarnav">
                <li> <a href="{{ route('whatsapp_templates.index') }}">{{ trans('main_trans.WhatsappTemplate') }}</a> </li>
                </li>
                <!-- <li> <a href="{{ route('certifications.index') }}">{{ trans('main_trans.Certifications') }}</a> </li>
                </li> -->


            </ul>
        </li>


       


        <!-- Settings-->
        <li>
            <a href="{{ route('settings.index') }}"><i class="fas fa-cogs"></i><span class="right-nav-text">
                    {{ trans('main_trans.Settings') }} </span></a>
        </li>

    </ul>
</div>
