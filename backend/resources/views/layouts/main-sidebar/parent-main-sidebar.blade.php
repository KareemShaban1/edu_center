<div class="scrollbar side-menu-bg" style="overflow: scroll">
    <ul class="nav navbar-nav side-menu" id="sidebarnav">
        <!-- menu item Dashboard-->
        <li>
            <a href="{{ route('dashboard.parents') }}">
                <div class="pull-left"><i class="ti-home">
                    </i><span class="right-nav-text">
                        {{trans('Parents_Dashboard/sidebar_trans.Dashboard')}}
                    </span>
                </div>
                <div class="clearfix"></div>
            </a>
        </li>
        <!-- menu title -->
        {{-- <li class="mt-10 mb-10 text-muted pl-4 font-medium menu-title">{{trans('main_trans.Programname')}} </li> --}}


        <!-- sons -->
        <li>
            <a href="{{route('sons.index')}}"><i class="fas fa-book-open"></i>
                <span
                    class="right-nav-text">
                    {{trans('Parents_Dashboard/sidebar_trans.Sons')}}
                </span></a>
        </li>

       

        
        <li>
            <a href="{{route('sons.attendance_report')}}"><i class="fas fa-book-open"></i><span
                    class="right-nav-text">
                    {{trans('Parents_Dashboard/sidebar_trans.Attendance_Report')}}
                </span>
            </a>
        </li>


        <li>
            <a href="{{route('sons.exam_report')}}"><i class="fas fa-book-open"></i><span
                    class="right-nav-text">
                    {{trans('Parents_Dashboard/sidebar_trans.Exam_Report')}}
                </span>
            </a>
        </li>

        <li>
            <a href="{{route('sons.quiz_report')}}"><i class="fas fa-book-open"></i><span
                    class="right-nav-text">
                    {{trans('Parents_Dashboard/sidebar_trans.Quiz_Report')}}
                </span>
            </a>
        </li>

        <li>
            <a href="{{route('sons.payment_report')}}"><i class="fas fa-book-open"></i><span
                    class="right-nav-text">
                    {{trans('Parents_Dashboard/sidebar_trans.Payment_Report')}}
                </span>
            </a>
        </li>




    </ul>
</div>
