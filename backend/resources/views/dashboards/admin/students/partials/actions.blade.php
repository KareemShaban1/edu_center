<div class="dropdown show">
    <a class="btn btn-success btn-sm dropdown-toggle" href="#" role="button" data-toggle="dropdown">
        {{ trans('admin/students_trans.Processes') }}
    </a>
    <div class="dropdown-menu">
        <a class="dropdown-item" href="{{ route('students.show', $student->id) }}">
            <i class="far fa-eye" style="color:#ffc107"></i>&nbsp;{{ trans('admin/students_trans.Show_Student_Info') }}
        </a>
        <a class="dropdown-item" href="{{ route('students.edit', $student->id) }}">
            <i class="fa fa-edit" style="color:green"></i>&nbsp;{{ trans('admin/students_trans.Edit_Student_Info') }}
        </a>
        <a class="dropdown-item" href="{{ route('attendance.student_attendance_report', $student->id) }}">
            <i class="fa fa-edit" style="color:#0000cc"></i>&nbsp;{{ trans('admin/students_trans.Show_Student_Attendance') }}
        </a>
        <a class="dropdown-item" data-toggle="modal" data-target="#Delete_Student{{ $student->id }}" href="#">
            <i class="fa fa-trash" style="color:red"></i>&nbsp;{{ trans('admin/students_trans.Delete_Student_Info') }}
        </a>
    </div>
</div>

@include('dashboards.admin.students.Delete')
