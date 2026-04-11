@extends('layouts.master')
@section('title')
{{__('Activity Logs')}}
@endsection
@section('css')
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css" />
@endsection
@section('content')
<div class="container-fluid">

    

    <div class="card">

    <div class="card-header">
        <h4 class="card-title">{{ __('Activity Logs') }}</h4>
    </div>
        <div class="card-body">
            <div class="row mb-3">
                <div class="col-md-3">
                    <label for="action-filter">{{ __('Action') }}</label>
                    <select id="action-filter" class="form-control">
                        <option value="">{{ __('All') }}</option>
                        <option value="created">{{ __('created') }}</option>
                        <option value="updated">{{ __('updated') }}</option>
                        <option value="deleted">{{ __('deleted') }}</option>
                    </select>
                </div>

                <div class="col-md-3">
                    <label for="model-filter">{{ __('Model') }}</label>
                    <select id="model-filter" class="form-control">
                        <option value="">{{ __('All') }}</option>
                        <option value="App\Models\User">{{ __('User') }}</option>
                        <option value="App\Models\Announcement">{{ __('Announcement') }}</option>
                        <option value="App\Models\Grade">{{ __('Grade') }}</option>
                        <option value="App\Models\Classes">{{ __('Classes') }}</option>
                        <option value="App\Models\Section">{{ __('Section') }}</option>
                        <option value="App\Models\Student">{{ __('Student') }}</option>
                        <option value="App\Models\Teacher">{{ __('Teacher') }}</option>
                        <option value="App\Models\Parents">{{ __('Parents') }}</option>
                        <option value="App\Models\Fee">{{ __('Fee') }}</option>
                        <option value="App\Models\Payment">{{ __('Payment') }}</option>
                        <option value="App\Models\Book">{{ __('Book') }}</option>
                        <option value="App\Models\Attendance">{{ __('Attendance') }}</option>
                        <option value="App\Models\CertificationTemplate">{{ __('Certification Template') }}</option>
                        <option value="App\Models\WhatsappTemplate">{{ __('Whatsapp Template') }}</option>
                        <option value="App\Models\Homework">{{ __('Homework') }}</option>
                        <option value="App\Models\ExamDegree">{{ __('Exam Degree') }}</option>
                        <option value="App\Models\QuizDegree">{{ __('Quiz Degree') }}</option>
                        <option value="App\Models\Lesson">{{ __('Lesson') }}</option>
                        <option value="App\Models\Unit">{{ __('Unit') }}</option>
                        <option value="App\Models\Question">{{ __('Question') }}</option>
                        <option value="App\Models\Answer">{{ __('Answer') }}</option>
                        <option value="App\Models\Library">{{ __('Library') }}</option>
                        <option value="App\Models\Word">{{ __('Word') }}</option>
                        <option value="App\Models\Note">{{ __('Note') }}</option>
                        <option value="App\Models\Setting">{{ __('Setting') }}</option>

                        <!-- Add more models as needed -->
                    </select>
                </div>

                <div class="col-md-3">
                    <label for="user-filter">{{ __('User') }}</label>
                    <select id="user-filter" class="form-control">
                        <option value="">{{ __('All') }}</option>
                        @foreach(App\Models\User::all() as $user)
                        <option value="{{ $user->id }}">{{ $user->name }}</option>
                        @endforeach
                    </select>
                </div>

                <div class="col-md-3">
                    <label for="date-filter">{{ __('Date') }}</label>
                    <input type="text" id="date-filter" class="form-control" placeholder="{{ __('Select Date Range') }}">
                </div>
            </div>


            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <table id="activity-logs-table" class="table dt-responsive nowrap w-100" data-page-length="25">
                                <thead>
                                    <tr>
                                        <th>{{ __('ID') }}</th>
                                        <th>{{ __('Action') }}</th>
                                        <th>{{ __('Model') }}</th>
                                        <th>{{ __('Model ID') }}</th>
                                        <th>{{ __('Changes') }}</th>
                                        <th>{{ __('User') }}</th>
                                        <th>{{ __('Date Time') }}</th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>


@endsection

@push('scripts')
<!-- Moment.js -->
<script src="https://cdn.jsdelivr.net/momentjs/latest/moment.min.js"></script>

<!-- Date Range Picker JS -->
<script src="https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js"></script>
<script>
    $(function() {
        var table = $('#activity-logs-table').DataTable({
            ajax: {
                url: "{{ route('activity-logs.data') }}",
                data: function(d) {
                    d.action = $('#action-filter').val();
                    d.model = $('#model-filter').val();
                    d.user = $('#user-filter').val();
                    d.date_range = $('#date-filter').val();
                }
            },
            columns: [{
                    data: 'id',
                    name: 'id',
                    searchable: false
                },
                {
                    data: 'action',
                    name: 'action'
                },
                {
                    data: 'model',
                    name: 'model'
                },
                {
                    data: 'model_id',
                    name: 'model_id',
                    searchable: true
                },
                {
                    data: 'changes',
                    name: 'changes'
                },
                {
                    data: 'user.name',
                    name: 'user.name',
                    defaultContent: 'System'
                },
                {
                    data: 'created_at',
                    name: 'created_at'
                },
            ],
            order: [
                [0, 'desc']
            ],
            dom: '<"d-flex justify-content-between align-items-center mb-3"lfB>rtip',
            pageLength: 25,
            lengthMenu: [
                [25, 50, 100, 250, 500],
                [25, 50, 100, 250, 500]
            ],
            responsive: true,
            drawCallback: function() {
                $('.dataTables_paginate > .pagination').addClass('pagination-rounded');
            }
        });

        // Apply filters
        $('#action-filter, #model-filter, #user-filter').change(function() {
            table.ajax.reload();
        });

        // Date Range Picker
        $('#date-filter').daterangepicker({
            autoUpdateInput: false,
            locale: {
                cancelLabel: 'Clear'
            }
        });

        $('#date-filter').on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
            table.ajax.reload();
        });

        $('#date-filter').on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('');
            table.ajax.reload();
        });
    });
</script>
@endpush