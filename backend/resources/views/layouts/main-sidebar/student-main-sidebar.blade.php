<div class="scrollbar side-menu-bg" style="overflow: scroll">
    <ul class="nav navbar-nav side-menu" id="sidebarnav">
        <!-- menu item Dashboard-->
        <li>
            <a href="{{ route('dashboard.Students') }}">
                <div class="pull-left"><i class="ti-home"></i><span class="right-nav-text">
                        {{ trans('Student_Dashboard/sidebar_trans.Dashboard') }}
                    </span>
                </div>
                <div class="clearfix"></div>
            </a>
        </li>
        <!-- menu title -->
        {{-- <li class="mt-10 mb-10 text-muted pl-4 font-medium menu-title">{{trans('Student_Dashboard/sidebar_trans.Programname')}} </li> --}}


        <!-- Exams -->
        <li>
            <a href="{{ route('student.exam', Auth::user()->id) }}">
                <i class="fas fa-book-open"></i><span class="right-nav-text">
                    {{ trans('Student_Dashboard/sidebar_trans.Exams') }}
                </span></a>
        </li>

        <li>
            <a href="{{ route('student.quiz', Auth::user()->id) }}">
                <i class="fas fa-book-open"></i><span class="right-nav-text">
                    {{ trans('Student_Dashboard/sidebar_trans.Quiz') }}
                </span></a>
        </li>

        <li>
            <a href="{{ route('student.student_homework') }}">
                <i class="fas fa-book-open"></i><span class="right-nav-text">
                    {{ trans('Student_Dashboard/sidebar_trans.Homework') }}
                </span></a>
        </li>

        <li>
            <a href="{{ route('student.payment', Auth::user()->id) }}">
                <i class="fas fa-money-bill-wave-alt"></i><span
                    class="right-nav-text">{{ trans('Student_Dashboard/sidebar_trans.Fees') }}</span></a>
        </li>

        <li>
            <a href="{{ route('student.attendance', Auth::user()->id) }}">
                <i class="fas fa-calendar-alt"></i><span class="right-nav-text">
                    {{ trans('Student_Dashboard/sidebar_trans.Attendance') }}
                </span></a>
        </li>

        <li>
            <a href="{{ route('student.library', $student->section_id) }}">
                <i class="fas fa-book"></i><span class="right-nav-text">
                    {{ trans('Student_Dashboard/sidebar_trans.Books') }}
                </span></a>
        </li>

        <li>
            <a href="{{ route('student.student_meetings', Auth::user()->id) }}">
                <i class="fas fa-video"></i><span class="right-nav-text">
                    {{ trans('Student_Dashboard/sidebar_trans.Online_Classes') }}
                </span></a>
        </li>


        <li>
            <a href="{{ route('student.announcements', $student->section_id) }}">
                <i class="fas fa-bell"></i><span class="right-nav-text">
                    {{ trans('Student_Dashboard/sidebar_trans.Announcements') }}
                </span></a>
        </li>




    </ul>
</div>
