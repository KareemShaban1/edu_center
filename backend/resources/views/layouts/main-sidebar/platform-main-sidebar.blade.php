<div class="container-fluid">
    <div class="row">
        <!-- Left Sidebar start-->
        <div class="side-menu-fixed">
            <div class="scrollbar side-menu-bg">
                <ul class="nav navbar-nav side-menu" id="sidebarnav">
                    <!-- Dashboard -->
                    <li>
                        <a href="{{ route('platform.dashboard') }}">
                            <i class="fa fa-dashboard"></i>
                            <span class="right-nav-text">{{ trans('Platform/main_trans.Dashboard') }}</span>
                        </a>
                    </li>

                    <!-- Tenants -->
                    <li>
                        <a href="javascript:void(0);" data-toggle="collapse" data-target="#tenants-menu">
                            <div class="pull-left">
                                <i class="fa fa-building"></i>
                                <span class="right-nav-text">{{ trans('Platform/main_trans.Tenants') }}</span>
                            </div>
                            <div class="pull-right">
                                <i class="ti-plus"></i>
                            </div>
                            <div class="clearfix"></div>
                        </a>
                        <ul id="tenants-menu" class="collapse" data-parent="#sidebarnav">
                            <li>
                                <a href="{{ route('platform.tenants.index') }}">
                                    {{ trans('Platform/main_trans.Tenant_List') }}
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('platform.tenants.create') }}">
                                    {{ trans('Platform/main_trans.Add_Tenant') }}
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
