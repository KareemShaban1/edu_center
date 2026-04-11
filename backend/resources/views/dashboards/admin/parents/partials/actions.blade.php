<div class="dropdown show">
    <a class="btn btn-success btn-sm dropdown-toggle" href="#" role="button" data-toggle="dropdown">
        {{ trans('admin/parent_trans.Processes') }}
    </a>
    <div class="dropdown-menu">
        <a class="dropdown-item" href="{{ route('parents.show', $parent->id) }}">
            <i class="far fa-eye" style="color:#ffc107"></i>&nbsp;{{ trans('admin/parent_trans.Show_Parent') }}
        </a>
        <a class="dropdown-item" href="{{ route('parents.edit', $parent->id) }}">
            <i class="fa fa-edit" style="color:green"></i>&nbsp;{{ trans('admin/parent_trans.Edit_Parent') }}
        </a>
        <a class="dropdown-item" data-toggle="modal" data-target="#Delete_parent{{ $parent->id }}" href="#">
            <i class="fa fa-trash" style="color:red"></i>&nbsp;{{ trans('admin/parent_trans.Delete_Parent') }}
        </a>
    </div>
</div>

@include('dashboards.admin.parents.Delete')
