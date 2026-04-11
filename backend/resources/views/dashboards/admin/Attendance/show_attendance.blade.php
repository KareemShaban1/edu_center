@extends('layouts.master')
@section('css')
<style>
    .template-option.active {
        background-color: #28a745 !important;
        color: white !important;
        border-color: #28a745 !important;
    }

    #messagePreview {
        font-size: 14px;
        min-height: 120px;
    }

    .btn-outline-primary {
        color: #28a745;
        border-color: #28a745;
    }

    .btn-outline-primary:hover {
        background-color: #28a745;
        border-color: #28a745;
    }
</style>
@endsection
@section('title')
{{ trans('admin/attendance_trans.Attendance') }}
@endsection
@section('page-header')
{{ trans('admin/attendance_trans.Attendance') }}
@endsection

@section('content')
<div class="row">


    <div class="col-xl-12  mb-30">
        <div class="card card-statistics h-100">
            <div class="card-body">

                <x-backend.alert />


                <div>
                    <h5 style="font-family: 'Cairo', sans-serif;color: red">
                        {{ trans('admin/attendance_trans.Today_Date') }}: {{ $date }}
                    </h5>
                    <div style="margin-bottom: 30px; color:rgb(164, 16, 16); font-weight:bold">
                        {{ $section->grade->grade_name }} / {{ $section->class->class_name }} /
                        {{ $section->section_name }}
                    </div>



                </div>
                <form method="post" id="attendanceForm" action="{{ route('attendance.store') }}">

                    @csrf
                    <div class="table-responsive">
                        <table id="datatable" class="table table-hover table-sm nowrap table-bordered  p-0"
                            data-page-length="50" style="text-align: center">
                            <thead>

                                <tr>
                                    <th class="alert-success">#</th>
                                    <th class="alert-success">{{ trans('admin/attendance_trans.Name') }}</th>
                                    <th class="alert-success">{{ trans('admin/attendance_trans.Email') }}</th>
                                    <th class="alert-success">{{ trans('admin/attendance_trans.Gender') }}
                                    </th>

                                    <th class="alert-success">{{ trans('admin/attendance_trans.Processes') }}
                                    </th>
                                    <th class="alert-success">{{ trans('admin/attendance_trans.Notes') }}
                                    </th>
                                    <th class="alert-success">{{ trans('admin/attendance_trans.Notifications') }}
                                    </th>

                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($students as $student)
                                @php
                                $student_attendance = $student
                                ->attendance()
                                ->where('attendance_date', $date)
                                ->first();

                                @endphp
                                <tr>
                                    <input type="hidden" name="student_id[]" value="{{ $student->id }}">
                                    <input type="hidden" name="grade_id" value="{{ $student->grade_id }}">
                                    <input type="hidden" name="class_id" value="{{ $student->class_id }}">
                                    <input type="hidden" name="section_id" value="{{ $student->section_id }}">

                                    <td>{{ $loop->index + 1 }}</td>
                                    <td>{{ $student->name }}</td>
                                    <td>{{ $student->email }}</td>
                                    <td>{{ $student->gender }}</td>

                                    <td>
                                        

                                        {{-- check if student attendance exist already based on current date (today) --}}
                                        @if (isset($student_attendance))
                                        {{-- student attendance exist --}}
                                        <label class="block text-gray-500 font-semibold sm:border-r sm:pr-4">
                                            <input name="attendances[{{ $student->id }}]"
                                                {{ $student_attendance->attendance_status == 1 ? 'checked' : '' }}
                                                class="leading-tight" type="radio" value="1">
                                            <span
                                                class="text-success">{{ trans('admin/attendance_trans.Presence') }}</span>
                                        </label>

                                        <label class="block text-gray-500 font-semibold">
                                            <input name="attendances[{{ $student->id }}]"
                                                {{ $student_attendance->attendance_status == 0 ? 'checked' : '' }}
                                                class="leading-tight" type="radio" value="0">
                                            <span
                                                class="text-danger">{{ trans('admin/attendance_trans.Absent') }}</span>
                                        </label>
                                        @else
                                        <label class="block text-gray-500 font-semibold sm:border-r sm:pr-4">
                                            <input name="attendances[{{ $student->id }}]"
                                                class="leading-tight" type="radio" value="1">
                                            <span
                                                class="text-success">{{ trans('admin/attendance_trans.Presence') }}</span>
                                        </label>

                                        <label class=" block text-gray-500 font-semibold">
                                            <input name="attendances[{{ $student->id }}]"
                                                class="leading-tight" type="radio" value="0">
                                            <span
                                                class="text-danger">{{ trans('admin/attendance_trans.Absent') }}</span>
                                        </label>
                                        @endif


                                    </td>

                                    <td>
                                        <input type="text" name="notes[{{ $student->id }}]"
                                            value="{{ $student_attendance->notes ?? '' }}" class="form-control"
                                            placeholder="{{ trans('admin/attendance_trans.Notes') }}">
                                    </td>

                                    <input type="hidden" name="attendance_date[{{ $student->id }}]" value="{{ $date }}">


                                    <td>
                                        @if ($student_attendance)
                                        <a href="{{ route('attendance.sendNotification', ['student_id' => $student->id]) }}"
                                            class="btn btn-warning btn-sm " role="button"
                                            aria-pressed="true">{{ trans('admin/attendance_trans.Send_Notification') }}
                                        </a>

                                        @if ($student->parents->father_phone)
                                        <button type="button"
                                            class="btn btn-success btn-sm mt-1 select-template-btn"
                                            data-toggle="modal" data-target="#whatsappTemplateModal"
                                            data-student-id="{{ $student->id }}"
                                            data-student-name="{{ $student->name }}"
                                            data-attendance-status="{{ $student_attendance->attendance_status ?? '' }}"
                                            data-attendance-notes="{{ $student_attendance->notes ?? '' }}">
                                            📲 {{ trans('admin/attendance_trans.Send_WhatsApp') }}
                                        </button>
                                        @endif
                                        @endif

                                    </td>

                                </tr>
                                @endforeach
                            </tbody>
                        </table>

                        <button class="btn btn-success" id="submitAttendance"
                            type="submit">{{ trans('admin/attendance_trans.Submit') }}</button>

                </form>
            </div>
        </div>
    </div>
</div>
</div>


<!-- WhatsApp Template Modal -->
<div class="modal fade" id="whatsappTemplateModal" tabindex="-1" role="dialog" aria-labelledby="templateModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="templateModalLabel">{{ trans('admin/attendance_trans.Select_Template') }}
                </h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="templateList">{{ trans('admin/attendance_trans.Select_Template') }}</label>
                    <div id="templateList" class="list-group">
                    </div>
                </div>

                <div class="form-group">
                    <label for="messagePreview">{{ trans('admin/attendance_trans.Message_Preview') }}:</label>
                    <textarea class="form-control" id="messagePreview" rows="5" dir="rtl"></textarea>
                </div>


                <input type="hidden" id="selectedStudentId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    {{ trans('admin/attendance_trans.Close') }}
                </button>
                <button type="button" class="btn btn-success" id="sendWhatsappBtn">
                    {{ trans('admin/attendance_trans.Send_WhatsApp') }}
                </button>
            </div>
        </div>
    </div>
</div>

<!-- row closed -->
@endsection
@push('scripts')
@verbatim
<script>
    function renderTemplate(templateContent, variables = {}) {
        return templateContent.replace(/{{\s*(\w+)\s*}}/g, function(match, key) {
            return variables[key] || '';
        });
    }
</script>
@endverbatim

<script>
    $(document).ready(function() {
        $('#datatable').DataTable({
            responsive: true,
            columnDefs: [{
                    responsivePriority: 1,
                    targets: 1
                },
                {
                    responsivePriority: 2,
                    targets: 5
                },
                {
                    responsivePriority: 3,
                    targets: 6
                }
            ],
            pageLength: 50,
            ordering: true,
        });

        let currentStudentData = null;
        let selectedTemplate = 'default';

        $('[data-toggle="tooltip"]').tooltip();

        // Modal cleanup on close
        $('#whatsappTemplateModal').on('hidden.bs.modal', function() {
            $('#messagePreview').val('');
            $('#selectedStudentId').val('');
            $('#templateList').empty();

            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        });

        // Modal open fix
        $('#whatsappTemplateModal').on('show.bs.modal', function() {
            $('body').addClass('modal-open');
        });
    });




    // DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        // Show WhatsApp modal and fetch templates
        $('#whatsappTemplateModal').on('show.bs.modal', function(event) {
            const button = $(event.relatedTarget);
            const studentId = button.data('student-id');
            const studentName = button.data('student-name');
            const attendanceStatus = button.data('attendance-status');
            const attendanceNotes = button.data('attendance-notes');

            $('#selectedStudentId').val(studentId);

            // Fetch templates using jQuery AJAX
            $.ajax({
                url: '/whatsapp_templates/list_json',
                method: 'GET',
                dataType: 'json',
                success: function(templates) {
                    const templateList = $('#templateList');
                    templateList.empty();

                    templates.forEach(function(template) {
                        const btn = $(`
                    <button type="button" class="list-group-item list-group-item-action">
                        ${template.name}
                    </button>
                `);

                        btn.on('click', function() {
                            const variables = {
                                student_name: studentName,
                                attendance_status: attendanceStatus,
                                notes: attendanceNotes
                            };

                            const message = renderTemplate(template.content, variables);
                            $('#messagePreview').val(message);
                        });

                        templateList.append(btn);
                    });
                },
                error: function(xhr, status, error) {
                    console.error("Error loading templates:", error);
                }
            });
        });

        // Handle Send WhatsApp button
        $('#sendWhatsappBtn').click(function() {
            const message = $('#messagePreview').val();
            if (!message.trim()) {
                toastr.error('الرجاء إدخال نص الرسالة');
                return;
            }

            const studentId = $('#selectedStudentId').val();
            if (!studentId) {
                console.error('No student ID found');
                toastr.error('حدث خطأ: لم يتم العثور على معرف الطالب');
                return;
            }

            const $form = $('<form>', {
                action: `{{ url('attendance_send_whatsapp') }}/${studentId}`,
                method: 'GET',
                target: '_blank'
            });

            $form.append($('<input>', {
                type: 'hidden',
                name: 'message',
                value: message
            }));

            $('body').append($form);
            $form.submit();
            $form.remove();

            $('#whatsappTemplateModal').modal('hide');
        });
    });
</script>
@endpush